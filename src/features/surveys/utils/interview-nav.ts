import { WIZARD_STEPS, type FieldSpec, type FieldType, type SectionSpec } from "../schema";

const SIMPLE: ReadonlySet<FieldType> = new Set([
  "enum", "multi", "yesNo", "string", "text", "email", "phone", "int", "date",
]);

const COMPLEX: ReadonlySet<FieldType> = new Set([
  "likert", "matrix3x3", "matrix2x5", "matrixDynamic", "matrix3col", "checklist", "signature",
]);

export function isSimpleField(field: FieldSpec): boolean {
  return SIMPLE.has(field.type);
}

export function isComplexField(field: FieldSpec): boolean {
  return COMPLEX.has(field.type);
}

/** Section mode = only complex fields (axes / checklist / signature blocks). */
export function isSectionMode(section: SectionSpec): boolean {
  return section.fields.length > 0 && section.fields.every(isComplexField);
}

/** Pre-filled from workshop context when the survey is opened in-app — skip in the walk. */
const CONTEXT_PREFILLED_KEYS = new Set(["projectCode", "workshopName", "ownerOrManagerName"]);

/** Fields shown one-at-a-time; empty when section mode. */
export function walkableFields(section: SectionSpec): FieldSpec[] {
  if (isSectionMode(section)) {
    return [];
  }
  return section.fields.filter((field) => !CONTEXT_PREFILLED_KEYS.has(field.key));
}

/**
 * For Incomplete / review jumps into a field-walk section: land on the first
 * required walkable field that fails `isValid` (photos skipped). Returns 0
 * for section-mode or when everything looks valid.
 */
export function firstInvalidWalkableIndex(
  section: SectionSpec,
  answers: Record<string, unknown>,
  isValid: (field: FieldSpec, value: unknown) => boolean
): number {
  const fields = walkableFields(section);
  if (fields.length === 0) {
    return 0;
  }
  const index = fields.findIndex(
    (field) => field.type !== "photo" && field.required && !isValid(field, answers[field.key])
  );
  return index >= 0 ? index : 0;
}

/**
 * Where Back lands from (step, fieldIndex) — null when already on the very
 * first question. From the review step it re-enters the last questionnaire
 * step; inside a field-walk it walks fields backwards; crossing a section
 * boundary lands on the last field of the previous walkable section (0 for
 * section-mode steps).
 */
export function backTarget(
  step: number,
  fieldIndex: number
): { step: number; fieldIndex: number } | null {
  if (step === WIZARD_STEPS.length) {
    return { step: WIZARD_STEPS.length - 1, fieldIndex: 0 };
  }
  const section = WIZARD_STEPS[step];
  if (section && !isSectionMode(section) && fieldIndex > 0) {
    return { step, fieldIndex: fieldIndex - 1 };
  }
  if (step === 0) {
    return null;
  }
  const prev = step - 1;
  const prevSection = WIZARD_STEPS[prev];
  return {
    step: prev,
    fieldIndex:
      prevSection && !isSectionMode(prevSection)
        ? Math.max(0, walkableFields(prevSection).length - 1)
        : 0,
  };
}
