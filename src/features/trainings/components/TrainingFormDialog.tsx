"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/shared/i18n";
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
import { TrainingFormFields } from "./TrainingFormFields";

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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("trainings.editTitle") : t("trainings.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("trainings.formHint")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <TrainingFormFields
            values={values}
            errors={errors}
            submitted={submitted}
            set={set}
          />
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? t("common.loading") : t("trainings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
