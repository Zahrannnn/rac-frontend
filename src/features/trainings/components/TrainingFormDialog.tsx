"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { useCreateTraining, useUpdateTraining } from "../hooks/use-trainings";
import type { TrainingDetails } from "../types";
import {
  EMPTY_TRAINING_FORM,
  formFromTraining,
  mapBackendFieldErrors,
  validateTrainingForm,
  type TrainingFormErrors,
  type TrainingFormValues,
} from "../utils/training-form";

function fieldError(
  t: ReturnType<typeof useT>,
  code: string | undefined
): string | undefined {
  if (!code) return undefined;
  // Zod issues carry dictionary keys ("validation.*") — legacy codes still map.
  if (code.startsWith("validation.")) return t(code as TranslationKey);
  if (code === "required") return t("trainings.validation.required");
  if (code === "max") return t("trainings.validation.max");
  if (code === "invalid") return t("trainings.validation.invalidGovernorate");
  if (code === "order") return t("trainings.validation.endAfterStart");
  return t("trainings.validation.required");
}

export function TrainingFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TrainingDetails | null;
}) {
  const t = useT();
  const { locale } = useI18n();
  const create = useCreateTraining();
  const update = useUpdateTraining(editing?.id ?? "");

  const [values, setValues] = useState<TrainingFormValues>(EMPTY_TRAINING_FORM);
  const [errors, setErrors] = useState<TrainingFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditing, setPrevEditing] = useState(editing);

  if (prevOpen !== open || prevEditing !== editing) {
    setPrevOpen(open);
    setPrevEditing(editing);
    if (open) {
      setValues(editing ? formFromTraining(editing) : EMPTY_TRAINING_FORM);
      setErrors({});
      setSubmitted(false);
    }
  }

  const set =
    (key: keyof TrainingFormValues) =>
    (value: string) =>
      setValues((prev) => ({ ...prev, [key]: value }));

  const handleSaveError = (apiError: unknown) => {
    const status = (apiError as { status?: number }).status;
    const fieldErrors = (apiError as { fieldErrors?: Record<string, string[]> }).fieldErrors;

    // 400 with a field-errors dictionary → mirror next to the form fields.
    if (status === 400 && fieldErrors && Object.keys(fieldErrors).length > 0) {
      setErrors(mapBackendFieldErrors(fieldErrors));
    } else if (status === 400) {
      toast.error(t("trainings.validation.required"));
    } else {
      toast.error(t("trainings.saveFailed"));
    }
  };

  const save = () => {
    setSubmitted(true);
    const result = validateTrainingForm(values);
    setErrors(result.errors);
    if (!result.valid || !result.payload) return;

    const pending = editing ? update : create;
    pending.mutate(result.payload, {
      onSuccess: () => {
        toast.success(editing ? t("trainings.updated") : t("trainings.created"));
        onOpenChange(false);
      },
      onError: handleSaveError,
    });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-5 overflow-y-auto">
        <div>
          <DialogTitle>
            {editing ? t("trainings.editTitle") : t("trainings.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("trainings.formHint")}</DialogDescription>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("trainings.sectionTrainer")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
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
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("trainings.sectionSchedule")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
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
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? t("common.loading") : t("trainings.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
