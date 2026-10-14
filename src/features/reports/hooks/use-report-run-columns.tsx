"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import type { ReportDefinition, ReportRun } from "../types";
import { useReportTitle } from "../utils/report-meta";

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

/**
 * Columns for the runs history table. Server-paged history in fixed
 * newest-first order — no client sortValue.
 */
export function useReportRunColumns(
  catalog: ReportDefinition[],
  onRegenerate: (definition: ReportDefinition) => void
): DataTableColumn<ReportRun>[] {
  const t = useT();

  return [
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
}
