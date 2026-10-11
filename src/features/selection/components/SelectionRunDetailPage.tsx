"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveBlob } from "@/shared/api/file-transfer";
import { routes } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import { QueryErrorState } from "@/shared/components/query-states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useExportSelectionRun, useSelectionRun } from "../hooks/use-selection";
import { formatUtc } from "../utils/datetime";
import { RunKindChip } from "./RunKindChip";
import { RunRankingTable } from "./RunRankingTable";
import { ScorecardDialog } from "./ScorecardDialog";

/**
 * The ranked list of one immutable run snapshot as a first-class page (replaces the
 * old dialog-in-dialog drill). Header meta, the off-platform hint, recommended /
 * reserve tabs, and the ranking table whose rows open the scorecard dialog — a
 * single nesting level. An invalid or failed runId renders the retryable error
 * state, never a crash or a toast.
 */
export function SelectionRunDetailPage({ runId }: { runId: string }) {
  const t = useT();
  const { locale } = useI18n();
  const { data, isPending, isError, refetch } = useSelectionRun(runId);
  const exportRun = useExportSelectionRun();
  const [scorecardRow, setScorecardRow] = useState<{ id: string; label: string } | null>(
    null
  );

  const download = () => {
    exportRun.mutate(runId, {
      onSuccess: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        toast.success(t("selection.runs.exported"));
      },
      onError: () => toast.error(t("selection.runs.exportFailed")),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={routes.selection}>
          <ArrowLeft data-icon="inline-start" className="rtl:rotate-180" />
          {t("selection.runs.backToSelection")}
        </Link>
      </Button>

      <PageHeader title={t("selection.runs.rankedTitle")} />

      {isPending ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4" aria-busy>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError || !data ? (
        <section className="rounded-lg border bg-card p-6">
          <QueryErrorState onRetry={() => void refetch()} />
        </section>
      ) : (
        <section
          aria-labelledby="selection-run-heading"
          className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5"
        >
          <div className="flex flex-col gap-2">
            <h2
              id="selection-run-heading"
              className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--navy)]"
            >
              <RunKindChip kind={data.kind} />
              <span>{formatUtc(data.runAtUtc, locale)}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{t("selection.runs.by", { name: data.runByUsername ?? "—" })}</span>
              <span className="tabular-nums">
                {t("selection.runs.counts", {
                  ranked: data.rankedCount,
                  recommended: data.recommendedCount,
                  reserve: data.reserveCount,
                })}
              </span>
              <span className="font-mono" dir="ltr">
                {t("selection.runs.rubricVersion", { version: data.rubricVersion })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-2xl text-xs text-muted-foreground">
              {t("selection.runs.offPlatformHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportRun.isPending}
              onClick={download}
            >
              <Download data-icon="inline-start" />
              {exportRun.isPending ? t("selection.runs.exporting") : t("selection.runs.export")}
            </Button>
          </div>

          <Tabs defaultValue="recommended">
            <TabsList>
              <TabsTrigger value="recommended">
                {t("selection.recommended")} ({data.recommendedCount})
              </TabsTrigger>
              <TabsTrigger value="reserve">
                {t("selection.reserve")} ({data.reserveCount})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="recommended" className="mt-3">
              <RunRankingTable rows={data.recommended} onOpenScorecard={setScorecardRow} />
            </TabsContent>
            <TabsContent value="reserve" className="mt-3">
              <RunRankingTable rows={data.reserve} onOpenScorecard={setScorecardRow} />
            </TabsContent>
          </Tabs>
        </section>
      )}

      <ScorecardDialog
        workshopId={scorecardRow?.id ?? null}
        workshopLabel={scorecardRow?.label ?? null}
        kind={data?.kind ?? "participation"}
        onOpenChange={(open) => {
          if (!open) setScorecardRow(null);
        }}
      />
    </div>
  );
}
