import {
  CONSENT_FIELD,
  WIZARD_STEPS,
  type FieldSpec,
  type SectionSpec,
} from "../schema";

export type SectionAnswers = Record<string, unknown>;

/** Parse the stored raw-JSON section map into typed answer objects. */
export function parseStoredSections(
  stored: Record<string, string>
): Record<string, SectionAnswers> {
  const parsed: Record<string, SectionAnswers> = {};

  for (const [key, raw] of Object.entries(stored)) {
    try {
      const value = JSON.parse(raw) as SectionAnswers;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed[key] = value;
      }
    } catch {
      // corrupt section — treat as unanswered
    }
  }

  return parsed;
}

/** Workforce matrix row: total derives from male + female when both are known;
 * a directly entered total survives while the split is unknown. */
export type WorkforceRow = { male: number | null; female: number | null; total: number | null };

export type WorkforceCol = "male" | "female" | "total";

export function computeWorkforceTotal(
  row: Pick<WorkforceRow, "male" | "female">
): number | null {
  if (row.male === null || row.female === null) {
    return null;
  }
  return row.male + row.female;
}

/**
 * One workforce-matrix cell edit (pure — see WorkforceMatrix).
 * - `total` edit: sets the total directly, male/female untouched.
 * - male/female edit:
 *   - both end non-null → total = male + female (derived);
 *   - exactly one ends non-null → keep the existing total ONLY if it was not itself
 *     derived (existing !== (oldMale ?? 0) + (oldFemale ?? 0)), else recompute
 *     (male ?? 0) + (female ?? 0) — clearing a cell of a derived row must not go stale;
 *   - both null → keep the existing total (manual entry with unknown split survives).
 */
export function computeWorkforceCell(
  prev: WorkforceRow | undefined,
  column: WorkforceCol,
  numeric: number | null
): WorkforceRow {
  const base: WorkforceRow = prev ?? { male: null, female: null, total: null };

  if (column === "total") {
    return { ...base, total: numeric };
  }

  const male = column === "male" ? numeric : base.male;
  const female = column === "female" ? numeric : base.female;

  let total: number | null;
  if (male !== null && female !== null) {
    total = male + female;
  } else if (male !== null || female !== null) {
    const wasDerived = base.total === (base.male ?? 0) + (base.female ?? 0);
    total = wasDerived ? (male ?? 0) + (female ?? 0) : base.total;
  } else {
    total = base.total;
  }

  return { male, female, total };
}

const EMPTY_STRING_VALUES = new Set(["", undefined, null]);

/** A field value counts as answered (mirrors the backend's trimmed-non-empty rule). */
export function isFieldAnswered(value: unknown): boolean {
  if (EMPTY_STRING_VALUES.has(value as string)) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value).length > 0;
  }
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EGYPT_PHONE_RE = /^01[0125][0-9]{8}$/;

/** Client-side per-field validity (server re-validates at submit). */
export function isFieldValid(field: FieldSpec, value: unknown): boolean {
  if (field.type === "photo") {
    return true; // photo validity = photoCount for the section, checked separately
  }
  if (!isFieldAnswered(value)) {
    return !field.required;
  }

  switch (field.type) {
    case "phone":
      return EGYPT_PHONE_RE.test(String(value).trim());
    case "email":
      return EMAIL_RE.test(String(value).trim());
    case "int": {
      const numeric = Number(value);
      if (!Number.isInteger(numeric)) {
        return false;
      }
      return (
        (field.min === undefined || numeric >= field.min) &&
        (field.max === undefined || numeric <= field.max)
      );
    }
    case "enum":
    case "yesNo":
      return !field.options || field.options.includes(String(value));
    case "multi":
      return (
        !field.options ||
        (Array.isArray(value) && value.every((entry) => field.options!.includes(String(entry))))
      );
    case "matrix3x3":
    case "matrix2x5":
    case "matrix3col":
    case "matrixDynamic":
    case "checklist":
      return typeof value === "object" && value !== null && Object.keys(value as object).length > 0;
    case "equipment": {
      // every item needs available (yes/no); condition is required once available
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const items = value as Record<string, { available?: unknown; condition?: unknown }>;
      return (field.options ?? []).every((item) => {
        const entry = items[item];
        if (!entry || (entry.available !== "yes" && entry.available !== "no")) {
          return false;
        }
        return (
          entry.available === "no" ||
          entry.condition === "working" ||
          entry.condition === "inadequate"
        );
      });
    }
    case "likert": {
      // Paper rule: exactly one mark per row — every row answered with a valid scale value.
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const marks = value as Record<string, unknown>;
      const scale = field.scale ?? [];
      return (field.options ?? []).every(
        (row) => row in marks && scale.includes(String(marks[row]))
      );
    }
    default:
      return true;
  }
}

/** A section is step-complete when every required field is answered and valid. */
export function isSectionComplete(section: SectionSpec, answers: SectionAnswers): boolean {
  return section.fields
    .filter((field) => field.required)
    .every((field) => isFieldValid(field, answers[field.key]));
}

/** Index of the first step that still needs work — where a resume lands. */
export function firstIncompleteStep(answers: Record<string, SectionAnswers>): number {
  return WIZARD_STEPS.findIndex((section) => !isSectionComplete(section, answers[section.key] ?? {}));
}

export function consentAnswer(answers: Record<string, SectionAnswers>): "yes" | "no" | null {
  const value = answers.consent?.[CONSENT_FIELD];
  return value === "yes" || value === "no" ? value : null;
}

/** Strip computed/auto values before PUT (workforce totals are recomputed server-side shape). */
export function buildSectionPayload(
  section: SectionSpec,
  answers: SectionAnswers
): Record<string, unknown> {
  if (section.key === "workforce" && answers.workforce) {
    const matrix = answers.workforce as Record<string, WorkforceRow>;
    const normalized: Record<string, WorkforceRow> = {};
    for (const [row, values] of Object.entries(matrix)) {
      const male = typeof values.male === "number" ? values.male : null;
      const female = typeof values.female === "number" ? values.female : null;
      normalized[row] = { male, female, total: computeWorkforceTotal({ male, female }) };
    }
    return { ...answers, workforce: normalized };
  }

  // condition/specs only make sense for available items — drop stale values
  if (section.key === "toolsEquipment" && answers.equipmentItems) {
    const items = answers.equipmentItems as Record<string, Record<string, unknown>>;
    const normalized: Record<string, Record<string, unknown>> = {};
    for (const [item, entry] of Object.entries(items)) {
      normalized[item] =
        entry.available === "yes" ? entry : { available: entry.available === "no" ? "no" : entry.available };
    }
    return { ...answers, equipmentItems: normalized };
  }

  return answers;
}
