import { mapApiFieldErrorKeys } from "@/shared/utils/api-field-errors";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/shared/utils/datetime";
import type { CreateTrainingPayload, TrainingDetails } from "../types";
import type { TranslationKey } from "@/shared/i18n";
import { createTrainingSchema } from "../validations/training-schema";

/** Form draft — DateTimePicker values are YYYY-MM-DDTHH:mm (UTC). */
export type TrainingFormValues = {
  trainerName: string;
  trainerKey: string;
  title: string;
  venue: string;
  governorate: string;
  startAtUtc: string;
  endAtUtc: string;
  notes: string;
};

export type TrainingFormErrors = Partial<Record<keyof TrainingFormValues, string>>;

export const EMPTY_TRAINING_FORM: TrainingFormValues = {
  trainerName: "",
  trainerKey: "",
  title: "",
  venue: "",
  governorate: "",
  startAtUtc: "",
  endAtUtc: "",
  notes: "",
};

export function formFromTraining(training: TrainingDetails): TrainingFormValues {
  return {
    trainerName: training.trainerName,
    trainerKey: training.trainerKey ?? "",
    title: training.title ?? "",
    venue: training.venue,
    governorate: training.governorate,
    startAtUtc: toDatetimeLocalValue(training.startAtUtc),
    endAtUtc: toDatetimeLocalValue(training.endAtUtc),
    notes: training.notes ?? "",
  };
}

export function validateTrainingForm(values: TrainingFormValues): {
  valid: boolean;
  errors: TrainingFormErrors;
  payload: CreateTrainingPayload | null;
} {
  // Zod parity: the schema mirrors CreateTrainingRequestValidator; issue messages are
  // i18n dictionary keys the dialog resolves (fieldError maps legacy codes too).
  const parsed = createTrainingSchema.safeParse(values);

  if (!parsed.success) {
    const errors: TrainingFormErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof TrainingFormErrors;
      const message = issue.message as TranslationKey;
      if (field && !errors[field]) {
        errors[field] = message;
      }
    }
    return { valid: false, errors, payload: null };
  }

  const start = fromDatetimeLocalValue(values.startAtUtc);
  const end = fromDatetimeLocalValue(values.endAtUtc);
  if (!start || !end) {
    return {
      valid: false,
      errors: { startAtUtc: "validation.dateInvalid", endAtUtc: "validation.dateInvalid" },
      payload: null,
    };
  }

  return {
    valid: true,
    errors: {},
    payload: {
      trainerName: values.trainerName.trim(),
      trainerKey: values.trainerKey.trim() || null,
      title: values.title.trim() || null,
      venue: values.venue.trim(),
      governorate: values.governorate,
      startAtUtc: start,
      endAtUtc: end,
      notes: values.notes.trim() || null,
    },
  };
}

/** Backend field-error keys are PascalCase ("TrainerName"); form keys are camelCase. */
export function mapBackendFieldErrors(
  fieldErrors: Record<string, string[]>
): TrainingFormErrors {
  return mapApiFieldErrorKeys(fieldErrors) as TrainingFormErrors;
}
