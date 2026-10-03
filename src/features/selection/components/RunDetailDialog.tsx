"use client";

import { Download } from "lucide-react";
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

function RunRowsTable({ rows }: { rows: SelectionRunRankedRow[] }) {
  const t = useT();
  const { locale } = useI18n();

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("selection.runs.emptyTier")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">{t("selection.rank")}</TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">{t("selection.workshop")}</TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">{t("selection.governorate")}</TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">{t("selection.score")}</TableHead>
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
                {row.totalWeighted.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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

  return (
    <Dialog open={Boolean(runId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <div className="flex flex-col gap-1">
          <DialogTitle>{t("selection.runs.detailTitle")}</DialogTitle>
          <DialogDescription>
            {data
              ? t("selection.runs.detailMeta", {
                  date: formatUtc(data.runAtUtc, locale),
                  by: data.runByUsername ?? "—",
                  scored: data.scoredCount,
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
              <p className="text-xs text-muted-foreground">
                {t("selection.runs.weightsVersion", { version: data.weightsVersion })}
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
                <RunRowsTable rows={data.recommended} />
              </TabsContent>
              <TabsContent value="reserve" className="max-h-[50vh] overflow-y-auto">
                <RunRowsTable rows={data.reserve} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
