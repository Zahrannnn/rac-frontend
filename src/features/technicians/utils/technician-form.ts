import type { TranslationKey, useT } from "@/shared/i18n";
import {
  SPECIALIZATION_OPTIONS,
  SPECIALTY_OTHER_DEFAULT,
  SPECIALTY_OTHER_SENTINEL,
} from "../constants/specializations";
import { technicianSchema, type TechnicianFormValues } from "../validations/technician-schema";
import type { CreateTechnicianPayload, UpdateTechnicianPayload } from "../api/technicians-adapter";
import type { Technician } from "../types";

type TFunc = ReturnType<typeof useT>;

/** Value the specialty Select shows: a listed option, the "Other" sentinel, or empty. */
export function specialtySelectValue(specialty: string | undefined): string {
  if (!specialty) {
    return "";
  }
  return SPECIALIZATION_OPTIONS.includes(specialty) ? specialty : SPECIALTY_OTHER_SENTINEL;
}

/** True when the specialty is free text (including the untouched "Other" default). */
export function isCustomSpecialty(specialty: string | null | undefined): boolean {
  return Boolean(specialty) && !SPECIALIZATION_OPTIONS.includes(specialty ?? "");
}

/** Resolve a Select pick into the stored specialty value. */
export function specialtyFromSelectValue(value: string): string {
  if (value === SPECIALTY_OTHER_SENTINEL) {
    return SPECIALTY_OTHER_DEFAULT;
  }
  return value;
}

/** Sentinel select value for "بدون ورشة" — Radix rejects empty-string item
 *  values, so the empty workshop draft ("") is represented by this sentinel. */
export const WORKSHOP_NONE_SENTINEL = "__none__";

/** Value the workshop Select shows: the picked workshop, or the empty option. */
export function workshopSelectValue(workshopId: string): string {
  return workshopId || WORKSHOP_NONE_SENTINEL;
}

/** Resolve a Select pick into the stored workshop draft ("" = no workshop). */
export function workshopFromSelectValue(value: string): string {
  return value === WORKSHOP_NONE_SENTINEL ? "" : value;
}

/** Sentinel for the unset draft of the registry attribute selects (gender /
 *  employment type — Radix rejects empty-string item values). */
export const UNSET_SELECT_SENTINEL = "__unset__";

/** Value a registry attribute Select shows: the picked key, or the unset option. */
export function registrySelectValue(key: string | undefined): string {
  return key || UNSET_SELECT_SENTINEL;
}

/** Resolve a registry attribute Select pick into the stored draft ("" = unset). */
export function registryFromSelectValue(value: string): string {
  return value === UNSET_SELECT_SENTINEL ? "" : value;
}

/** Registry attribute key → translation key (REGISTRY-GAS-SPEC §2: the stored
 *  camelCase keys localize — the profile page renders labels, not raw keys). */
export const GENDER_LABELS: Record<string, TranslationKey> = {
  male: "technicians.genderMale",
  female: "technicians.genderFemale",
};

export const EMPLOYMENT_LABELS: Record<string, TranslationKey> = {
  engineer: "technicians.roleEngineer",
  observer: "technicians.roleObserver",
  technician: "technicians.roleTechnician",
  assistant: "technicians.roleAssistant",
};

/** نوع العمالة labels (REGISTRY-GAS-SPEC §11) — the camelCase nature keys localize
 *  (حر = مستقل is one option). */
export const EMPLOYMENT_NATURE_LABELS: Record<string, TranslationKey> = {
  permanent: "technicians.naturePermanent",
  temporary: "technicians.natureTemporary",
  selfEmployed: "technicians.natureSelfEmployed",
  other: "technicians.natureOther",
};

/** Localized label of a stored registry attribute key; null when unset; an
 *  unknown key falls back to itself (never silently blank). */
export function registryAttributeLabel(
  key: string | null | undefined,
  labels: Record<string, TranslationKey>,
  t: TFunc
): string | null {
  if (!key) {
    return null;
  }
  return labels[key] ? t(labels[key]) : key;
}

/** Seed the form from an existing technician, or blank for create mode. */
export function toFormValues(
  technician: Technician | null,
  lockedWorkshopId?: string
): TechnicianFormValues {
  return {
    fullName: technician?.fullName ?? "",
    fullNameAr: technician?.fullNameAr ?? "",
    nationalId: technician?.nationalId ?? "",
    mobile: technician?.mobile ?? "",
    workshopId: technician?.workshopId ?? lockedWorkshopId ?? "",
    specialty: technician?.specialty ?? "",
    yearsOfExperience: technician?.yearsOfExperience ?? 0,
    notes: technician?.notes ?? "",
    employmentType: technician?.employmentType ?? "",
    employmentNature: technician?.employmentNature ?? "",
    hasModernRefrigerantExperience:
      technician?.hasModernRefrigerantExperience === true
        ? "yes"
        : technician?.hasModernRefrigerantExperience === false
          ? "no"
          : "",
    address: technician?.address ?? "",
  };
}

/** Arabic per-field message for a failed form validation (pure — `t` injected). */
function technicianFieldMessage(field: string, t: TFunc): string {
  switch (field) {
    case "nationalId":
      return t("technicians.nationalIdInvalid");
    case "mobile":
      return t("wizard.mobileInvalid");
    case "yearsOfExperience":
      return t("technicians.yearsInvalid");
    case "fullName":
      return t("technicians.fullNameRequired");
    case "employmentType":
      return t("technicians.employmentTypeInvalid");
    case "employmentNature":
      return t("technicians.employmentNatureInvalid");
    case "employer":
      return t("technicians.employerTooLong");
    case "address":
      return t("technicians.addressTooLong");
    default:
      return t("common.error");
  }
}

export type TechnicianSubmission =
  | { data: TechnicianFormValues }
  | { errors: Record<string, string> };

/** Edit mode validates only the PATCH-able fields — the immutable workshopId passes
 *  through untouched, while nationalId is validated like any other editable field
 *  (14-digit when present; a blank draft goes as null = keep the stored value). */
const editableTechnicianSchema = technicianSchema.omit({
  workshopId: true,
});

function firstErrorPerField(
  issues: { path: (string | number | symbol)[] }[],
  t: TFunc
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!errors[field]) {
      errors[field] = technicianFieldMessage(field, t);
    }
  }
  return errors;
}

/**
 * Single-parse form validation: valid trimmed values, or the first Arabic
 * message per field. The mode decides which fields are validated — edit mode
 * also accepts a cleared yearsOfExperience draft ("" → left unchanged on the
 * wire), while create mode requires the number.
 */
export function parseTechnicianSubmission(
  values: TechnicianFormValues,
  t: TFunc,
  mode: "create" | "edit"
): TechnicianSubmission {
  if (mode === "edit") {
    const parsed = editableTechnicianSchema.safeParse(values);
    if (!parsed.success) {
      return { errors: firstErrorPerField(parsed.error.issues, t) };
    }
    return { data: { ...values, ...parsed.data } };
  }

  const parsed = technicianSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: firstErrorPerField(parsed.error.issues, t) };
  }
  if (parsed.data.yearsOfExperience === "") {
    return { errors: { yearsOfExperience: technicianFieldMessage("yearsOfExperience", t) } };
  }
  return { data: parsed.data };
}

/** POST /technicians body — blank optionals (incl. nationalId/mobile) are omitted
 *  (undefined drops at serialization), matching the nullable backend contract.
 *  An empty workshop draft goes as null = the free-technician "بدون ورشة" state.
 *  The registry attribute fields follow the same rule: unset drafts omitted.
 *  Gender and age never travel — they derive from the national ID (§10B). */
export function toTechnicianCreatePayload(data: TechnicianFormValues): CreateTechnicianPayload {
  return {
    fullName: data.fullName,
    fullNameAr: data.fullNameAr || undefined,
    nationalId: data.nationalId || undefined,
    mobile: data.mobile || undefined,
    workshopId: data.workshopId || null,
    specialty: data.specialty || undefined,
    // Create requires the number (parse rejects the "" draft in create mode).
    yearsOfExperience: typeof data.yearsOfExperience === "number" ? data.yearsOfExperience : 0,
    notes: data.notes || undefined,
    employmentType: data.employmentType || undefined,
    employmentNature: data.employmentNature || undefined,
    hasModernRefrigerantExperience: modernExperienceToWire(data.hasModernRefrigerantExperience),
    address: data.address || undefined,
  };
}

/** §11 yes/no draft → wire value: "" (unpicked) drops at serialization, "yes"/"no"
 *  travel as true/false. */
function modernExperienceToWire(draft: "" | "yes" | "no"): boolean | undefined {
  return draft === "" ? undefined : draft === "yes";
}

/** PATCH /technicians/{id} body — workshopId is immutable per contract; a cleared
 *  nationalId/mobile goes as null (the backend keeps the stored value — null = keep).
 *  Registry attribute strings follow REGISTRY-GAS-SPEC §1/§2 three-way semantics:
 *  a draft value sets, a blank draft over a stored value clears ("" on the wire),
 *  and a blank draft with nothing stored is omitted (= keep). Gender and age never
 *  travel — they derive from the national ID (§10B). */
export function toTechnicianUpdatePayload(
  data: TechnicianFormValues,
  original?: Technician | null
): UpdateTechnicianPayload {
  // Three-way registry-string semantics, mirroring the RAC2 form: the stored value
  // is what makes a blank draft an explicit clear rather than a no-op.
  const registryField = (
    draft: string | undefined | null,
    originalValue: string | null | undefined
  ) => (draft ? draft : originalValue ? "" : undefined);

  return {
    fullName: data.fullName,
    fullNameAr: data.fullNameAr || null,
    nationalId: data.nationalId || null,
    mobile: data.mobile || null,
    specialty: data.specialty || null,
    // Cleared draft → key omitted → the stored value is left unchanged (PATCH semantics).
    ...(typeof data.yearsOfExperience === "number"
      ? { yearsOfExperience: data.yearsOfExperience }
      : {}),
    notes: data.notes || null,
    employmentType: registryField(data.employmentType, original?.employmentType),
    employmentNature: registryField(data.employmentNature, original?.employmentNature),
    // §11 flag: only a picked draft travels (omitted = keep; no clear path).
    ...(data.hasModernRefrigerantExperience
      ? { hasModernRefrigerantExperience: data.hasModernRefrigerantExperience === "yes" }
      : {}),
    address: registryField(data.address, original?.address),
  };
}
