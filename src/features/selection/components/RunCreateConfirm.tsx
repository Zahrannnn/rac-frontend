"use client";

import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { isFullSummary, useDashboardSummary } from "@/features/dashboard";
import { useT } from "@/shared/i18n";
import { useCreateSelectionRun, useSelectionRuns } from "../hooks/use-selection";
import type { RubricKind } from "../types";
import { RUN_TARGETS } from "../utils/rubric";

/**
 * Live "will be scored" count for the participation confirm — rendered only while
 * the dialog is open so viewers never pay for the dashboard call. Shown for the
 * full summary shape only (the type guard carries the role logic — no role checks);
 * other shapes / pending / error stay silent because the static message already
 * explains the mechanics. The machine re-scores EVERY Complete survey on each
 * run, so the evaluated set is the completed total from `surveys` — NOT
 * `attention.awaitingSelectionCount`, which is only the delta since the latest
 * run's ranked set (surfaced as a "new since" suffix when > 0).
 */
function ParticipationLiveCount() {
  const t = useT();
  const { data, isPending, isError } = useDashboardSummary();

  if (isPending || isError || !data || !isFullSummary(data)) {
    return null;
  }

  const completed = data.surveys.filter((survey) => survey.status === "Complete").length;
  const fresh = data.attention.awaitingSelectionCount;

  return (
    <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      {fresh > 0
        ? t("selection.runs.confirmParticipationCountNew", { total: completed, fresh })
        : t("selection.runs.confirmParticipationCount", { count: completed })}
    </p>
  );
}

/**
 * Size of the evaluated set for the equipment confirm: the latest participation
 * run's recommended count from the runs list (shared query cache — no dashboard
 * call). Unavailable (no participation run on page 1) → the line is omitted.
 */
function EquipmentLiveCount() {
  const t = useT();
  const { data } = useSelectionRuns(1);
  const latest = data?.items.find((run) => run.kind === "participation");

  if (!latest) {
    return null;
  }

  return (
    <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      {t("selection.runs.confirmEquipmentCount", { count: latest.recommendedCount })}
    </p>
  );
}

/**
 * Kind-aware create confirmation: states what the machine-scored run will cut
 * (RUN_TARGETS interpolation) and adds the live evaluated-set count when it is
 * known. The backend 409s when there is nothing to rank — the localized reason
 * (per kind) replaces the English-only server detail.
 */
export function RunCreateConfirm({
  kind,
  open,
  onOpenChange,
}: {
  kind: RubricKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const create = useCreateSelectionRun();
  const titleKey =
    kind === "participation"
      ? "selection.runs.confirmParticipationTitle"
      : "selection.runs.confirmEquipmentTitle";
  const messageKey =
    kind === "participation"
      ? "selection.runs.confirmParticipationMessage"
      : "selection.runs.confirmEquipmentMessage";

  const confirm = () => {
    create.mutate(
      { kind },
      {
        onSuccess: () => {
          toast.success(t("selection.runs.created"));
          onOpenChange(false);
        },
        onError: (error) => {
          const status = (error as { status?: number }).status;
          if (status === 409) {
            toast.error(
              t(
                kind === "participation"
                  ? "selection.runs.participationEmptyConflict"
                  : "selection.runs.equipmentNeedsParticipationConflict"
              )
            );
          } else {
            toast.error(t("selection.runs.createFailed"));
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t(titleKey)}</DialogTitle>
        <DialogDescription>{t(messageKey, RUN_TARGETS[kind])}</DialogDescription>
        {open && kind === "participation" ? <ParticipationLiveCount /> : null}
        {open && kind === "equipment" ? <EquipmentLiveCount /> : null}
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={create.isPending} onClick={confirm}>
            <Play data-icon="inline-start" />
            {create.isPending ? t("selection.runs.running") : t("selection.runs.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
