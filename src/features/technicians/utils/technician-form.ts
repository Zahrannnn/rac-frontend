import type { useT } from "@/shared/i18n";
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
    case "workshopId":
      return t("technicians.workshopRequired");
    case "fullName":
      return t("technicians.fullNameRequired");
    default:
      return t("common.error");
  }
}

export type TechnicianSubmission =
  | { data: TechnicianFormValues }
  | { errors: Record<string, string> };

/** Edit mode validates only the PATCH-able fields — the immutable
 *  nationalId/workshopId pass through untouched (a legacy stored nationalId
 *  must not block saving, and neither is sent). */
const editableTechnicianSchema = technicianSchema.omit({
  nationalId: true,
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

/** POST /technicians body — blank optionals are omitted (undefined drops at serialization). */
export function toTechnicianCreatePayload(data: TechnicianFormValues): CreateTechnicianPayload {
  return {
    fullName: data.fullName,
    fullNameAr: data.fullNameAr || undefined,
    nationalId: data.nationalId,
    mobile: data.mobile,
    workshopId: data.workshopId,
    specialty: data.specialty || undefined,
    // Create requires the number (parse rejects the "" draft in create mode).
    yearsOfExperience: typeof data.yearsOfExperience === "number" ? data.yearsOfExperience : 0,
    notes: data.notes || undefined,
  };
}

/** PATCH /technicians/{id} body — nationalId/workshopId are immutable per contract; blanks go as null. */
export function toTechnicianUpdatePayload(data: TechnicianFormValues): UpdateTechnicianPayload {
  return {
    fullName: data.fullName,
    fullNameAr: data.fullNameAr || null,
    mobile: data.mobile,
    specialty: data.specialty || null,
    // Cleared draft → key omitted → the stored value is left unchanged (PATCH semantics).
    ...(typeof data.yearsOfExperience === "number"
      ? { yearsOfExperience: data.yearsOfExperience }
      : {}),
    notes: data.notes || null,
  };
}
