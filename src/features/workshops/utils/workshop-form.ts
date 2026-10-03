import type { useT } from "@/shared/i18n";
import {
  districtChoiceSchema,
  editWorkshopSchema,
  type EditWorkshopValues,
} from "../validations/workshop-schema";
import type { UpdateWorkshopPayload } from "../api/workshops-adapter";
import type { Workshop } from "../types";

type TFunc = ReturnType<typeof useT>;

/** Seed the edit form from the current workshop record. */
export function toEditFormValues(workshop: Workshop): EditWorkshopValues {
  return {
    nameEn: workshop.nameEn,
    nameAr: workshop.nameAr ?? "",
    ownerName: workshop.ownerName,
    mobile: workshop.mobile,
    telephone: workshop.telephone ?? "",
    type: workshop.type,
    governorate: workshop.governorate as EditWorkshopValues["governorate"],
    district: workshop.district ?? "",
    address: workshop.address,
    activities: workshop.activities ?? "",
    numberOfTechnicians: workshop.numberOfTechnicians,
    notes: workshop.notes ?? "",
    latitude: workshop.latitude,
    longitude: workshop.longitude,
  };
}

/** Arabic per-field message for a failed edit-form validation (pure — `t` injected). */
function editFieldMessage(field: string, t: TFunc): string {
  switch (field) {
    case "mobile":
      return t("wizard.mobileInvalid");
    case "numberOfTechnicians":
      return t("wizard.numberOfTechniciansInvalid");
    case "address":
      return t("wizard.addressRequired");
    case "latitude":
    case "longitude":
      return t("wizard.gpsPairInvalid");
    default:
      return t("common.error");
  }
}

export type EditFormSubmission =
  | { data: EditWorkshopValues }
  | { errors: Record<string, string> };

/**
 * Full edit-form validation: the record schema plus the Other-district escape
 * hatch (manual entry required when it is selected, mirroring the wizard).
 * Single parse; the district verdict wins over any schema issue on `district`.
 */
export function parseEditFormSubmission(
  values: EditWorkshopValues,
  otherSelected: boolean,
  t: TFunc
): EditFormSubmission {
  const parsed = editWorkshopSchema.safeParse(values);
  const choice = districtChoiceSchema.safeParse({ district: values.district, otherSelected });

  if (!parsed.success || !choice.success) {
    const errors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) {
          errors[field] = editFieldMessage(field, t);
        }
      }
    }
    if (!choice.success) {
      errors.district = t("validation.districtRequired");
    }
    return { errors };
  }

  return { data: parsed.data };
}

/** The PATCH /workshops/{id} body — mirrors UpdateWorkshopRequest 1:1. */
export function toUpdatePayload(
  values: EditWorkshopValues,
  confirmDuplicate: boolean
): UpdateWorkshopPayload {
  return {
    nameEn: values.nameEn,
    nameAr: values.nameAr || null,
    ownerName: values.ownerName,
    mobile: values.mobile,
    telephone: values.telephone || null,
    type: values.type,
    governorate: values.governorate,
    district: values.district || null,
    address: values.address,
    activities: values.activities || null,
    numberOfTechnicians: values.numberOfTechnicians,
    notes: values.notes || null,
    latitude: values.latitude,
    longitude: values.longitude,
    confirmDuplicate,
  };
}
