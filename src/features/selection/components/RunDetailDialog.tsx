"use client";

import { useState } from "react";
import { Download, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveBlob } from "@/shared/api/file-transfer";
import { useI18n, useT } from "@/shared/i18n";
import { governorateLabel } from "@/shared/constants/egypt";
import { QueryErrorState } from "@/shared/components/query-states";
import { useExportSelectionRun, useSelectionRun } from "../hooks/use-selection";
import type { SelectionRunRankedRow } from "../types";
import { formatUtc } from "../utils/datetime";
import { tierLabelKey } from "../utils/rubric";
import { RunKindChip } from "./RunKindChip";
import { ScorecardDialog } from "./ScorecardDialog";

function TierBadge({ tier }: { tier: string }) {
  const t = useT();
  const labelKey = tierLabelKey(tier);

  if (!labelKey) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
      {t(labelKey)}
    </span>
  );
}

/** One tier of the frozen snapshot — every row opens the live scorecard. */
function RunRowsTable({
  rows,
  onOpenScorecard,
}: {
  rows: SelectionRunRankedRow[];
  onOpenScorecard: (row: { id: string; label: string }) => void;
}) {
  const t = useT();
  const { locale } = useI18n();

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("selection.runs.emptyTier")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.rank")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.workshop")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.governorate")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.score")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.tier")}
            </TableHead>
            <TableHead className="h-10 w-24 bg-[var(--navy-shell)] text-xs text-white">
              <span className="sr-only">{t("selection.scorecard.title")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.workshopId} className="h-12">
              <TableCell className="tabular-nums font-semibold">#{row.rank}</TableCell>
              <TableCell>
                <span className="block truncate font-medium">{row.workshopName}</span>
                <span className="block font-mono text-xs text-primary">{row.workshopCode}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {governorateLabel(row.governorate, locale)}
              </TableCell>
              <TableCell className="tabular-nums font-bold text-primary">
                {row.totalScore.toLocaleString("en-US")}
              </TableCell>
              <TableCell>
                <TierBadge tier={row.tier} />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onOpenScorecard({
                      id: row.workshopId,
                      label: `${row.workshopCode} — ${row.workshopName}`,
                    })
                  }
                  title={t("selection.scorecard.title")}
                >
                  <FileSearch className="h-4 w-4" aria-hidden />
                  <span className="sr-only">
                    {t("selection.scorecard.openFor", { name: row.workshopName })}
                  </span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The rankings view of one immutable run snapshot: recommended / reserve tiers with
 * text-label badges, plus a scorecard action per row (the live rubric breakdown —
 * may 409 when the workshop is no longer scorable).
 */
export function RunDetailDialog({
  runId,
  onOpenChange,
}: {
  runId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { data, isPending, isError, refetch } = useSelectionRun(runId);
  const exportRun = useExportSelectionRun();
  const [scorecardRow, setScorecardRow] = useState<{ id: string; label: string } | null>(null);

  const download = () => {
    if (!runId) return;
    exportRun.mutate(runId, {
      onSuccess: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        toast.success(t("selection.runs.exported"));
      },
      onError: () => toast.error(t("selection.runs.exportFailed")),
    });
  };

  const closeAll = (open: boolean) => {
    if (!open) setScorecardRow(null);
    onOpenChange(open);
  };

  return (
    <Dialog open={Boolean(runId)} onOpenChange={closeAll}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <div className="flex flex-col gap-1">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {data ? <RunKindChip kind={data.kind} /> : null}
            {t("selection.runs.detailTitle")}
          </DialogTitle>
          <DialogDescription>
            {data
              ? t("selection.runs.detailMeta", {
                  date: formatUtc(data.runAtUtc, locale),
                  by: data.runByUsername ?? "—",
                  ranked: data.rankedCount,
                })
              : t("selection.runs.loading")}
          </DialogDescription>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2" aria-busy>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !data ? (
          <QueryErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{t("selection.runs.offPlatformHint")}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                {t("selection.runs.rubricVersion", { version: data.rubricVersion })}
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
            <Tabs defaultValue="recommended" className="min-h-0 flex-1 overflow-hidden">
              <TabsList>
                <TabsTrigger value="recommended">
                  {t("selection.recommended")} ({data.recommendedCount})
                </TabsTrigger>
                <TabsTrigger value="reserve">
                  {t("selection.reserve")} ({data.reserveCount})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="recommended" className="max-h-[50vh] overflow-y-auto">
                <RunRowsTable rows={data.recommended} onOpenScorecard={setScorecardRow} />
              </TabsContent>
              <TabsContent value="reserve" className="max-h-[50vh] overflow-y-auto">
                <RunRowsTable rows={data.reserve} onOpenScorecard={setScorecardRow} />
              </TabsContent>
            </Tabs>
          </>
        )}

        <ScorecardDialog
          workshopId={scorecardRow?.id ?? null}
          workshopLabel={scorecardRow?.label ?? null}
          kind={data?.kind ?? "participation"}
          onOpenChange={(open) => {
            if (!open) setScorecardRow(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
