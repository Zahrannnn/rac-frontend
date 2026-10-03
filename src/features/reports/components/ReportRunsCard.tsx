"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { History, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPagination } from "@/shared/components/list-pagination";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { useReportRuns } from "../hooks/use-reports";
import type { ReportDefinition, ReportRun, ReportRunFilters } from "../types";
import { resolveReportTitle, useReportTitle } from "../utils/report-meta";

/** Shared chrome for the runs table header cells; only the column width varies. */
const HEAD_CELL_CLASS =
  "h-10 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white";

function FormatBadge({ format }: { format: ReportRun["format"] }) {
  const styles: Record<ReportRun["format"], string> = {
    Xlsx: "bg-primary/15 text-primary",
    Csv: "bg-muted text-muted-foreground",
    Json: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide",
        styles[format]
      )}
    >
      {format}
    </span>
  );
}

function RunReportCell({
  reportKey,
  catalog,
}: {
  reportKey: string;
  catalog: ReportDefinition[];
}) {
  const title = useReportTitle(reportKey, catalog);
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-[var(--navy)]">{title}</p>
      <p className="truncate font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
        {reportKey}
      </p>
    </div>
  );
}

/**
 * Row action — re-opens the existing generate flow for this report key. Runs store
 * no downloadable artifact server-side, so "download" means regenerating fresh data.
 */
function RegenerateCell({
  reportKey,
  catalog,
  onRegenerate,
}: {
  reportKey: string;
  catalog: ReportDefinition[];
  onRegenerate: (definition: ReportDefinition) => void;
}) {
  const t = useT();
  const definition = catalog.find((item) => item.key === reportKey);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!definition}
      onClick={() => definition && onRegenerate(definition)}
    >
      <RotateCw data-icon="inline-start" />
      {t("reports.runRegenerate")}
    </Button>
  );
}

/** Run history — GET /reports/runs (perm `reports:manage`), newest first. */
export function ReportRunsCard({
  filters,
  onFiltersChange,
  catalog,
  onRegenerate,
}: {
  filters: ReportRunFilters;
  onFiltersChange: (filters: ReportRunFilters) => void;
  catalog: ReportDefinition[];
  onRegenerate: (definition: ReportDefinition) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { data, isPending, isPlaceholderData, isError, refetch } = useReportRuns(filters);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--navy)]">
            <History className="h-4 w-4" aria-hidden />
            {t("reports.runsTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("reports.runsSubtitle")}</p>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-64">
          <Label className="sr-only">{t("reports.runReport")}</Label>
          <Select
            value={filters.reportKey ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                page: 1,
                reportKey: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allReports")}</SelectItem>
              {catalog.map((definition) => (
                <SelectItem key={definition.key} value={definition.key}>
                  {resolveReportTitle(definition.key, t, locale, catalog)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md bg-muted px-6 py-10 text-center">
          <History className="h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-[var(--navy)]">{t("reports.runsEmpty")}</p>
          <p className="max-w-[36ch] text-xs text-muted-foreground">{t("reports.runsEmptyHint")}</p>
        </div>
      ) : data ? (
        <>
          <div
            className={cn(
              "overflow-x-auto rounded-md border",
              isPlaceholderData && "opacity-60"
            )}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={HEAD_CELL_CLASS}>
                    {t("reports.runReport")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-24`}>
                    {t("reports.runFormat")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-20`}>
                    {t("reports.runRows")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-24`}>
                    {t("reports.runDuration")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-32`}>
                    {t("reports.runBy")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-24`}>
                    {t("reports.runTrigger")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-40`}>
                    {t("reports.runAt")}
                  </TableHead>
                  <TableHead className={`${HEAD_CELL_CLASS} w-32`}>
                    {t("reports.runActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((run) => (
                  <TableRow key={run.id} className="h-12">
                    <TableCell>
                      <RunReportCell reportKey={run.reportKey} catalog={catalog} />
                    </TableCell>
                    <TableCell>
                      <FormatBadge format={run.format} />
                    </TableCell>
                    <TableCell className="tabular-nums">{run.rowCount.toLocaleString()}</TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {t("reports.runDurationMs", { ms: run.durationMs ?? 0 })}
                    </TableCell>
                    <TableCell className="truncate text-sm">{run.requestedBy ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{run.trigger}</TableCell>
                    <TableCell className="text-sm tabular-nums" dir="ltr">
                      {formatDateTimeUtc(run.generatedAtUtc)}
                    </TableCell>
                    <TableCell>
                      <RegenerateCell
                        reportKey={run.reportKey}
                        catalog={catalog}
                        onRegenerate={onRegenerate}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => onFiltersChange({ ...filters, page })}
            disabled={isPlaceholderData}
            labels={{
              summary: `${t("reports.runTotalCount", { count: data.totalCount })} · ${t(
                "workshops.pageOf",
                { page: data.page, total: totalPages }
              )}`,
              previous: t("workshops.prevPage"),
              next: t("workshops.nextPage"),
            }}
          />
        </>
      ) : null}
    </section>
  );
}
