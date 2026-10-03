import type { useT } from "@/shared/i18n";
import type { CreateWorkshopPayload, DuplicateProbe } from "../api/workshops-adapter";
import {
  basicInfoSchema,
  districtChoiceSchema,
  locationSchema,
  type BasicInfoValues,
  type LocationValues,
} from "../validations/workshop-schema";

/** The dictionary function shape (derived from useT) for pure helpers. */
type TFunc = ReturnType<typeof useT>;

/** Wizard location adds the (never-submitted) Other-district escape-hatch flag. */
export type WizardLocation = LocationValues & { districtOther: boolean };

export type WizardState = {
  basic: BasicInfoValues;
  location: WizardLocation;
  notes: string;
};

export function initialWizardState(): WizardState {
  return {
    basic: {
      nameEn: "",
      nameAr: "",
      ownerName: "",
      mobile: "",
      telephone: "",
      type: "Formal",
      activities: "",
      numberOfTechnicians: null,
    },
    location: {
      governorate: "Cairo",
      district: "",
      districtOther: false,
      address: "",
      latitude: null,
      longitude: null,
    },
    notes: "",
  };
}

/** Governorate change wipes both the picked district and any manual entry. */
export function districtReset() {
  return { district: "", districtOther: false };
}

function districtChoiceInput(state: WizardState) {
  return { district: state.location.district, otherSelected: state.location.districtOther };
}

/** A step is valid when its zod slice parses; steps 0 and 3 have no field rules. */
export function isWizardStepValid(step: number, state: WizardState): boolean {
  if (step === 1) {
    return basicInfoSchema.safeParse(state.basic).success;
  }
  if (step === 2) {
    return (
      locationSchema.safeParse(state.location).success &&
      districtChoiceSchema.safeParse(districtChoiceInput(state)).success
    );
  }
  return true;
}

/** First message wins per field (zod emits one issue per failed check). */
function firstFieldErrors(
  issues: readonly { path: readonly PropertyKey[] }[],
  step: number,
  t: TFunc
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!errors[field]) {
      errors[field] = wizardFieldMessage(step, field, t);
    }
  }
  return errors;
}

/** Arabic per-field messages for the failing step (pure — `t` is injected). */
export function collectStepErrors(
  step: number,
  state: WizardState,
  t: TFunc
): Record<string, string> {
  if (step === 1) {
    const parsed = basicInfoSchema.safeParse(state.basic);
    return parsed.success ? {} : firstFieldErrors(parsed.error.issues, step, t);
  }
  if (step !== 2) {
    return {};
  }

  const parsed = locationSchema.safeParse(state.location);
  const errors = parsed.success ? {} : firstFieldErrors(parsed.error.issues, step, t);

  // Other-district escape hatch: manual entry required when it is selected.
  const choice = districtChoiceSchema.safeParse(districtChoiceInput(state));
  if (!choice.success && !errors.district) {
    errors.district = t("validation.districtRequired");
  }
  return errors;
}

function wizardFieldMessage(step: number, field: string, t: TFunc): string {
  if (step === 1) {
    switch (field) {
      case "mobile":
        return t("wizard.mobileInvalid");
      case "numberOfTechnicians":
        return t("wizard.numberOfTechniciansInvalid");
      case "nameEn":
        return t("wizard.nameEnRequired");
      case "ownerName":
        return t("wizard.ownerNameRequired");
      default:
        return t("common.error");
    }
  }

  switch (field) {
    case "governorate":
      return t("wizard.governorateRequired");
    case "address":
      return t("wizard.addressRequired");
    case "latitude":
    case "longitude":
      return t("wizard.gpsPairInvalid");
    default:
      return t("common.error");
  }
}

/** The POST /workshops body — mirrors CreateWorkshopRequest 1:1. */
export function buildCreatePayload(
  state: WizardState,
  probe: DuplicateProbe & { confirmDuplicate: boolean }
): CreateWorkshopPayload {
  return {
    ...probe,
    nameAr: state.basic.nameAr || undefined,
    telephone: state.basic.telephone || undefined,
    district: state.location.district || undefined,
    type: state.basic.type,
    activities: state.basic.activities || undefined,
    numberOfTechnicians: state.basic.numberOfTechnicians,
    notes: state.notes || undefined,
  };
}

export type { BasicInfoValues, LocationValues };
