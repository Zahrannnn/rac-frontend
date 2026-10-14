"use client";

import { DateTimePicker } from "@/components/ui/date-picker";
import { DialogSection } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/form/form-field";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { createFieldErrorMapper } from "@/shared/form/field-error";
import { useI18n, useT } from "@/shared/i18n";
import type {
  TrainingFormErrors,
  TrainingFormValues,
} from "../utils/training-form";

/** Legacy short codes map into the trainings dictionary; unknown codes fall
 * back to the generic required message (matches the pre-extraction mapper). */
const fieldError = createFieldErrorMapper({
  legacyCodes: {
    required: "trainings.validation.required",
    max: "trainings.validation.max",
    invalid: "trainings.validation.invalidGovernorate",
    order: "trainings.validation.endAfterStart",
  },
  fallback: "trainings.validation.required",
});

/** The two field groups of the training dialog — trainer identity and
 * schedule. Pure presentation over the shared form state. */
export function TrainingFormFields({
  values,
  errors,
  submitted,
  set,
}: {
  values: TrainingFormValues;
  errors: TrainingFormErrors;
  submitted: boolean;
  set: (key: keyof TrainingFormValues) => (value: string) => void;
}) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <>
      <DialogSection title={t("trainings.sectionTrainer")}>
        <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t("trainings.trainerName")}
          required
          error={submitted ? fieldError(t, errors.trainerName) : undefined}
        >
          <Input
            value={values.trainerName}
            onChange={(e) => set("trainerName")(e.target.value)}
            aria-invalid={submitted && Boolean(errors.trainerName)}
          />
        </FormField>
        <FormField
          label={t("trainings.trainerKey")}
          error={submitted ? fieldError(t, errors.trainerKey) : undefined}
        >
          <Input
            value={values.trainerKey}
            onChange={(e) => set("trainerKey")(e.target.value)}
            placeholder={t("trainings.trainerKeyHint")}
          />
        </FormField>
        </div>
      </DialogSection>

      <DialogSection title={t("trainings.sectionSchedule")}>
        <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          className="sm:col-span-2"
          label={t("trainings.sessionTitle")}
          error={submitted ? fieldError(t, errors.title) : undefined}
        >
          <Input value={values.title} onChange={(e) => set("title")(e.target.value)} />
        </FormField>
        <FormField
          className="sm:col-span-2"
          label={t("trainings.venue")}
          required
          error={submitted ? fieldError(t, errors.venue) : undefined}
        >
          <Input
            value={values.venue}
            onChange={(e) => set("venue")(e.target.value)}
            aria-invalid={submitted && Boolean(errors.venue)}
          />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Label>
            {t("trainings.governorate")}
            <span className="text-destructive"> *</span>
          </Label>
          <Select value={values.governorate || undefined} onValueChange={set("governorate")}>
            <SelectTrigger aria-invalid={submitted && Boolean(errors.governorate)}>
              <SelectValue placeholder={t("trainings.governorate")} />
            </SelectTrigger>
            <SelectContent>
              {GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {governorateLabel(g, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitted && errors.governorate ? (
            <p className="text-xs text-destructive">{fieldError(t, errors.governorate)}</p>
          ) : null}
        </div>
        <div className="hidden sm:block" />
        <FormField
          label={t("trainings.startAt")}
          required
          error={submitted ? fieldError(t, errors.startAtUtc) : undefined}
        >
          <DateTimePicker
            value={values.startAtUtc}
            onChange={set("startAtUtc")}
            aria-invalid={submitted && Boolean(errors.startAtUtc)}
          />
        </FormField>
        <FormField
          label={t("trainings.endAt")}
          required
          error={submitted ? fieldError(t, errors.endAtUtc) : undefined}
        >
          <DateTimePicker
            value={values.endAtUtc}
            onChange={set("endAtUtc")}
            aria-invalid={submitted && Boolean(errors.endAtUtc)}
          />
        </FormField>
        <FormField
          className="sm:col-span-2"
          label={t("trainings.notes")}
          error={submitted ? fieldError(t, errors.notes) : undefined}
        >
          <Textarea
            value={values.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={3}
          />
        </FormField>
        </div>
      </DialogSection>
    </>
  );
}
