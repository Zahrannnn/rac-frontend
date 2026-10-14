"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { History } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useReportRuns } from "../hooks/use-reports";
import { useReportRunColumns } from "../hooks/use-report-run-columns";
import type { ReportDefinition, ReportRunFilters } from "../types";
import { resolveReportTitle } from "../utils/report-meta";

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
  const columns = useReportRunColumns(catalog, onRegenerate);

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
