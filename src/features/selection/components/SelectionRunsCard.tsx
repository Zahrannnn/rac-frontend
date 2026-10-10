"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { toast } from "sonner";
import { History, Play, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n, useT } from "@/shared/i18n";
import { can, useAuth } from "@/features/auth";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { RunDetailDialog } from "./RunDetailDialog";
import { RunKindChip } from "./RunKindChip";
import { useCreateSelectionRun, useSelectionRuns } from "../hooks/use-selection";
import type { RubricKind, SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";
import { RUN_TARGETS } from "../utils/rubric";

/** Kind-aware create confirmation: states what the machine-scored run will cut. */
function RunCreateConfirm({
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
            // The backend 409s when there is nothing to rank — the localized
            // reason (per kind) replaces the English-only server detail.
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
        <DialogDescription>
          {t(messageKey, RUN_TARGETS[kind])}
        </DialogDescription>
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

/**
 * Runs history for both rubric kinds. Creation is gated by the "selection:run"
 * permission (never a role check); the equipment action stays disabled — with a
 * visible hint — until a participation run exists (the backend 409s regardless).
 */
export function SelectionRunsCard() {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const canRun = Boolean(user && can(user.permissions, "selection:run"));

  const [page, setPage] = useState(1);
  const [confirmKind, setConfirmKind] = useState<RubricKind | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useSelectionRuns(page);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;
  const hasParticipationRun = Boolean(data?.items.some((run) => run.kind === "participation"));

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      aria-labelledby="selection-runs-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="selection-runs-heading"
            className="flex items-center gap-2 text-base font-semibold text-[var(--navy)]"
          >
            <History className="h-4 w-4" aria-hidden />
            {t("selection.runs.title")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("selection.runs.subtitle")}</p>
        </div>
        {canRun ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setConfirmKind("participation")}>
              <Play data-icon="inline-start" />
              {t("selection.runs.createParticipation")}
            </Button>
            <span title={hasParticipationRun ? undefined : t("selection.runs.equipmentNeedsParticipationHint")}>
              <Button
                type="button"
                variant="outline"
                disabled={!hasParticipationRun}
                onClick={() => setConfirmKind("equipment")}
              >
                <Wrench data-icon="inline-start" />
                {t("selection.runs.createEquipment")}
              </Button>
            </span>
          </div>
        ) : null}
      </div>
      {canRun && !hasParticipationRun ? (
        <p className="text-xs text-muted-foreground">
          {t("selection.runs.equipmentNeedsParticipationHint")}
        </p>
      ) : null}

      {isPending ? (
        <SkeletonRows count={3} className="h-12 w-full rounded-lg" />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("selection.runs.empty")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {data.items.map((run: SelectionRunSummary) => (
              <li key={run.id}>
                <button
                  type="button"
                  onClick={() => setDetailId(run.id)}
                  className="flex w-full flex-col gap-1 rounded-lg border px-3 py-3 text-start transition-colors hover:bg-[var(--row-selected)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--navy)]">
                      <RunKindChip kind={run.kind} />
                      {formatUtc(run.runAtUtc, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("selection.runs.by", { name: run.runByUsername ?? "—" })}
                      {run.notes ? ` · ${run.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-0.5 sm:items-end">
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {t("selection.runs.counts", {
                        ranked: run.rankedCount,
                        recommended: run.recommendedCount,
                        reserve: run.reserveCount,
                      })}
                    </p>
                    <p className="font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
                      {run.rubricVersion}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("common.previous")}
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {page}/{totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <RunCreateConfirm
        kind={confirmKind ?? "participation"}
        open={confirmKind !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
      />
      <RunDetailDialog runId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </section>
  );
}
