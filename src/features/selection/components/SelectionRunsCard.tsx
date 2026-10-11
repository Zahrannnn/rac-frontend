"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n, useT } from "@/shared/i18n";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { saveBlob } from "@/shared/api/file-transfer";
import { selectionRun } from "@/shared/constants/routes";
import { totalPagesOf } from "@/shared/utils/pagination";
import { RunKindChip } from "./RunKindChip";
import { useExportSelectionRun, useSelectionRuns } from "../hooks/use-selection";
import type { SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";

/** One participation run and the equipment runs derived from it. */
export type SelectionRunGroup = {
  run: SelectionRunSummary;
  children: SelectionRunSummary[];
};

/**
 * Audit-trail grouping (presentation only — the wire shape carries no parent id):
 * nest each equipment run under the most recent participation run with an earlier
 * `runAtUtc` among the loaded items (the list is newest-first, so the first match
 * is the right parent). An equipment run whose parent sits outside the loaded page
 * (pagination boundary) stays flat.
 */
export function groupRunsForHistory(items: SelectionRunSummary[]): SelectionRunGroup[] {
  const groups = new Map<string, SelectionRunGroup>();
  const order: SelectionRunGroup[] = [];

  for (const run of items) {
    if (run.kind === "equipment") {
      // Date.parse, not string compare: System.Text.Json only emits fractional
      // seconds when nonzero, so equal-second timestamps would mis-sort lexically.
      const parent = items.find(
        (candidate) =>
          candidate.kind === "participation" &&
          Date.parse(candidate.runAtUtc) < Date.parse(run.runAtUtc)
      );
      if (parent) {
        const existing = groups.get(parent.id);
        if (existing) {
          existing.children.push(run);
        } else {
          // The equipment run is newer than its parent, so it can be walked first.
          const group: SelectionRunGroup = { run: parent, children: [run] };
          groups.set(parent.id, group);
          order.push(group);
        }
        continue;
      }
    }
    if (run.kind === "participation" && groups.has(run.id)) {
      continue; // already grouped by an equipment run walked earlier
    }
    const group: SelectionRunGroup = { run, children: [] };
    groups.set(run.id, group);
    order.push(group);
  }

  return order;
}

/** One compact history row: chip, date, run by, counts, rubric version, actions. */
function RunHistoryRow({
  run,
  onExport,
  exportPending,
}: {
  run: SelectionRunSummary;
  onExport: (runId: string) => void;
  exportPending: boolean;
}) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <RunKindChip kind={run.kind} />
      <span className="text-sm font-medium text-[var(--navy)]">
        {formatUtc(run.runAtUtc, locale)}
      </span>
      <span className="text-xs text-muted-foreground">
        {t("selection.runs.by", { name: run.runByUsername ?? "—" })}
        {run.notes ? ` · ${run.notes}` : ""}
      </span>
      <span className="ms-auto text-xs tabular-nums text-muted-foreground">
        {t("selection.runs.counts", {
          ranked: run.rankedCount,
          recommended: run.recommendedCount,
          reserve: run.reserveCount,
        })}
      </span>
      <span className="font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
        {run.rubricVersion}
      </span>
      <span className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={selectionRun(run.id)}>
            <Eye className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t("selection.runs.viewList")}</span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={exportPending}
          onClick={() => onExport(run.id)}
        >
          <Download className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("selection.runs.export")}</span>
        </Button>
      </span>
    </div>
  );
}

/**
 * The compact run-history audit trail (Screen 05): divide-y rows with the newest
 * first, equipment runs nested under the participation run they derived from.
 * Pagination stays at 10 rows per page. Creation CTAs live on the recommendation
 * cards above — the history empty state explains only, to avoid stacking
 * duplicate create buttons on a runs-less page.
 */
export function SelectionRunsCard() {
  const t = useT();

  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useSelectionRuns(page);
  const exportRun = useExportSelectionRun();

  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  const download = (runId: string) => {
    exportRun.mutate(runId, {
      onSuccess: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        toast.success(t("selection.runs.exported"));
      },
      onError: () => toast.error(t("selection.runs.exportFailed")),
    });
  };

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      aria-labelledby="selection-runs-heading"
    >
      <div>
        <h2
          id="selection-runs-heading"
          className="flex items-center gap-2 text-base font-semibold text-[var(--navy)]"
        >
          <History className="h-4 w-4" aria-hidden />
          {t("selection.runs.historyTitle")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("selection.runs.subtitle")}</p>
      </div>

      {isPending ? (
        <SkeletonRows count={4} className="h-10 w-full rounded-lg" />
      ) : isError ? (
        <QueryErrorState onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <History className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="max-w-[52ch] text-sm leading-6 text-muted-foreground">
            {t("selection.runs.emptyHint")}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {groupRunsForHistory(data.items).map(({ run, children }) => (
              <li key={run.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <RunHistoryRow
                  run={run}
                  onExport={download}
                  exportPending={exportRun.isPending}
                />
                {children.length > 0 ? (
                  <ul className="ms-4 flex flex-col gap-2 border-s ps-3">
                    {children.map((child) => (
                      <li key={child.id}>
                        <RunHistoryRow
                          run={child}
                          onExport={download}
                          exportPending={exportRun.isPending}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
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
    </section>
  );
}
