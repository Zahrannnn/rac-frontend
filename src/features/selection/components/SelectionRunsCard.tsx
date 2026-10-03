"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { toast } from "sonner";
import { History, Play } from "lucide-react";
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
import {
  useCreateSelectionRun,
  useSelectionRuns,
} from "../hooks/use-selection";
import type { SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";

function RunScoringConfirm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const create = useCreateSelectionRun();

  const confirm = () => {
    create.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("selection.runs.created"));
        onOpenChange(false);
      },
      onError: (error) => {
        const status = (error as { status?: number }).status;
        toast.error(
          status === 409 ? t("selection.runs.noScores") : t("selection.runs.createFailed")
        );
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("selection.runs.confirmTitle")}</DialogTitle>
        <DialogDescription>{t("selection.runs.confirmMessage")}</DialogDescription>
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={create.isPending} onClick={confirm}>
            {create.isPending ? t("selection.runs.running") : t("selection.runs.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SelectionRunsCard() {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const canScore = Boolean(user && can(user.permissions, "selection:score"));

  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useSelectionRuns(page);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4" aria-labelledby="selection-runs-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="selection-runs-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--navy)]">
            <History className="h-4 w-4" aria-hidden />
            {t("selection.runs.title")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("selection.runs.subtitle")}</p>
        </div>
        {canScore ? (
          <Button type="button" onClick={() => setConfirmOpen(true)}>
            <Play data-icon="inline-start" />
            {t("selection.runs.runScoring")}
          </Button>
        ) : null}
      </div>

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
                  <div>
                    <p className="text-sm font-semibold text-[var(--navy)]">
                      {formatUtc(run.runAtUtc, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("selection.runs.by", { name: run.runByUsername ?? "—" })}
                      {run.notes ? ` · ${run.notes}` : ""}
                    </p>
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t("selection.runs.counts", {
                      scored: run.scoredCount,
                      recommended: run.recommendedCount,
                      reserve: run.reserveCount,
                    })}
                  </p>
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

      <RunScoringConfirm open={confirmOpen} onOpenChange={setConfirmOpen} />
      <RunDetailDialog runId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </section>
  );
}
