"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/i18n";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { totalPagesOf } from "@/shared/utils/pagination";
import { RunHistoryRow } from "./RunHistoryRow";
import { useSelectionRuns } from "../hooks/use-selection";
import { useSelectionRunExport } from "../hooks/use-selection-run-export";
import { groupRunsForHistory } from "../utils/run-history";

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
  const { download, exportPending } = useSelectionRunExport();

  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

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
                  exportPending={exportPending}
                />
                {children.length > 0 ? (
                  <ul className="ms-4 flex flex-col gap-2 border-s ps-3">
                    {children.map((child) => (
                      <li key={child.id}>
                        <RunHistoryRow
                          run={child}
                          onExport={download}
                          exportPending={exportPending}
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
