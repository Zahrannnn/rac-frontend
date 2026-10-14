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
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { useReportRuns } from "../hooks/use-reports";
import type { ReportDefinition, ReportRun, ReportRunFilters } from "../types";
import { resolveReportTitle, useReportTitle } from "../utils/report-meta";

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

  // Server-paged history in fixed newest-first order — no client sortValue.
  const columns: DataTableColumn<ReportRun>[] = [
    {
      key: "report",
      header: t("reports.runReport"),
      cell: (run) => <RunReportCell reportKey={run.reportKey} catalog={catalog} />,
    },
    {
      key: "format",
      header: t("reports.runFormat"),
      headerClassName: "w-24",
      cell: (run) => <FormatBadge format={run.format} />,
    },
    {
      key: "rows",
      header: t("reports.runRows"),
      headerClassName: "w-20",
      className: "tabular-nums",
      cell: (run) => run.rowCount.toLocaleString(),
    },
    {
      key: "duration",
      header: t("reports.runDuration"),
      headerClassName: "w-24",
      className: "tabular-nums text-xs text-muted-foreground",
      cell: (run) => t("reports.runDurationMs", { ms: run.durationMs ?? 0 }),
    },
    {
      key: "by",
      header: t("reports.runBy"),
      headerClassName: "w-32",
      className: "truncate text-sm",
      cell: (run) => run.requestedBy ?? "—",
    },
    {
      key: "trigger",
      header: t("reports.runTrigger"),
      headerClassName: "w-24",
      className: "text-xs text-muted-foreground",
      cell: (run) => run.trigger,
    },
    {
      key: "at",
      header: t("reports.runAt"),
      headerClassName: "w-40",
      className: "text-sm tabular-nums",
      cell: (run) => <span dir="ltr">{formatDateTimeUtc(run.generatedAtUtc)}</span>,
    },
    {
      key: "actions",
      header: t("reports.runActions"),
      headerClassName: "w-32",
      cell: (run) => (
        <RegenerateCell reportKey={run.reportKey} catalog={catalog} onRegenerate={onRegenerate} />
      ),
    },
  ];

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

      <DataTable
        className={cn(isPlaceholderData && "opacity-60")}
        columns={columns}
        data={data?.items}
        getRowId={(run) => run.id}
        ariaLabel={t("reports.runsTitle")}
        isLoading={isPending}
        error={isError}
        onRetry={() => refetch()}
        emptyState={{ title: t("reports.runsEmpty"), hint: t("reports.runsEmptyHint") }}
        pagination={
          data
            ? {
                page: filters.page,
                totalPages,
                onPageChange: (page) => onFiltersChange({ ...filters, page }),
                summary: `${t("reports.runTotalCount", { count: data.totalCount })} · ${t(
                  "workshops.pageOf",
                  { page: data.page, total: totalPages }
                )}`,
                disabled: isPlaceholderData,
              }
            : undefined
        }
      />
    </section>
  );
}
