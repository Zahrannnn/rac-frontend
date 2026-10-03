"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import { useT } from "@/shared/i18n";
import { CRITERIA, criterionLabel } from "../utils/criteria";
import { draftFromWeights, validateWeights, type WeightDraft } from "../utils/weights";
import { useUpdateWeights, useWeights } from "../hooks/use-selection";

type Phase = "editing" | "confirming";

/**
 * Criterion weights editor. PUT /selection/weights is gated server-side by
 * `selection:score` — the caller only mounts this when that permission is held.
 */
export function WeightsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const { data } = useWeights();
  const update = useUpdateWeights();

  const [draft, setDraft] = useState<WeightDraft>({});
  const [phase, setPhase] = useState<Phase>("editing");
  const [submitted, setSubmitted] = useState(false);

  // Re-seed whenever the dialog opens or fresh weights arrive (render-time
  // adjustment over an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevWeights, setPrevWeights] = useState(data);
  if (prevOpen !== open || prevWeights !== data) {
    setPrevOpen(open);
    setPrevWeights(data);
    if (open && data) {
      setDraft(draftFromWeights(data.weights));
      setPhase("editing");
      setSubmitted(false);
    }
  }

  const validation = validateWeights(draft);
  const showTotalError = submitted && !validation.totalValid;

  const save = () => {
    setSubmitted(true);
    if (!validation.valid) {
      return;
    }
    setPhase("confirming");
  };

  const confirm = () => {
    update.mutate(validation.values, {
      onSuccess: () => {
        toast.success(t("selection.weightsSaved"));
        onOpenChange(false);
      },
      onError: () => toast.error(t("common.error")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div>
          <DialogTitle>{t("selection.weightsTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("selection.weightsTitle")}
          </DialogDescription>
        </div>

        {phase === "confirming" ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-[var(--warning)]/15 p-3 text-sm font-medium text-[#8a5a14]">
              {t("selection.weightsConfirmMessage")}
            </p>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {validation.values.map((weight) => (
                <li key={weight.criterionKey} className="flex justify-between gap-4">
                  <span>{t(criterionLabel(weight.criterionKey))}</span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {weight.weightPercent}%
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPhase("editing")}>
                {t("profile.cancel")}
              </Button>
              <Button onClick={confirm} disabled={update.isPending}>
                {t("selection.weightsConfirm")}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CRITERIA.map((criterion) => {
                const parseError = submitted && validation.parseErrors[criterion.key];
                const rangeError = submitted && validation.rangeErrors[criterion.key];
                return (
                  <FormField
                    key={criterion.key}
                    label={t(criterion.labelKey)}
                    required
                    error={
                      parseError
                        ? t("selection.weightsInvalidNumber")
                        : rangeError
                          ? t("selection.weightsInvalidRange")
                          : undefined
                    }
                  >
                    <Input
                      inputMode="decimal"
                      dir="ltr"
                      value={draft[criterion.key] ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, [criterion.key]: event.target.value }))
                      }
                      aria-invalid={Boolean(parseError || rangeError)}
                    />
                  </FormField>
                );
              })}
            </div>

            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-muted-foreground">
                {t("selection.weightsTotal")}
              </span>
              <span
                className={`tabular-nums font-bold ${
                  showTotalError ? "text-destructive" : "text-[var(--navy)]"
                }`}
              >
                {Number.isFinite(validation.total) ? validation.total : "—"}%
              </span>
            </div>
            {showTotalError ? (
              <p className="text-sm text-destructive" role="alert">
                {t("selection.weightsInvalidTotal")}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("profile.cancel")}
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {t("selection.weightsSave")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
