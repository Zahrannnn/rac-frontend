"use client";

import { useMemo } from "react";
import { BarChart3, MapPinned } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GovernorateCount } from "@/features/dashboard";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import type { ReportRun } from "../types";

/** Workshops-by-governorate bar list, fed by GET /dashboard/summary. */
export function GovernorateChart({
  governorates,
  isPending,
  isError,
}: {
  governorates: GovernorateCount[];
  isPending: boolean;
  isError: boolean;
}) {
  const t = useT();
  const { locale } = useI18n();
  const maxGovernorate = governorates[0]?.count ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <MapPinned className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-[var(--navy)]">
          {t("reports.byGovernorate")}
        </h3>
      </div>

      {isPending ? (
        <div className="mt-4 flex flex-col gap-2" aria-busy>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("common.error")}
        </p>
      ) : governorates.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.rankingEmpty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {governorates.map((row) => (
            <li key={row.governorate} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate text-muted-foreground">
                {governorateLabel(row.governorate, locale)}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.round((row.count / Math.max(1, maxGovernorate)) * 100)}%`,
                  }}
                />
              </span>
              <span className="w-8 text-end font-semibold tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const RUN_FORMATS: ReportRun["format"][] = ["Xlsx", "Csv", "Json"];

const RUN_FORMAT_LABEL: Record<ReportRun["format"], TranslationKey> = {
  Xlsx: "reports.formatXlsx",
  Csv: "reports.formatCsv",
  Json: "reports.formatJson",
};

/** Runs-by-format bar list, fed by GET /reports/runs (perm `reports:manage`). */
export function RunsFormatChart({
  items,
  isPending,
  isError,
}: {
  items: ReportRun[];
  isPending: boolean;
  isError: boolean;
}) {
  const t = useT();

  const runsByFormat = useMemo(
    () =>
      RUN_FORMATS.map((format) => ({
        format,
        count: items.filter((run) => run.format === format).length,
      })),
    [items]
  );

  const maxRunsFormat = Math.max(1, ...runsByFormat.map((row) => row.count));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-[var(--navy)]">
          {t("reports.runsByFormat")}
        </h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {t("reports.runsByFormatHint")}
      </p>

      {isPending ? (
        <div className="mt-4 flex flex-col gap-2" aria-busy>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("common.error")}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {runsByFormat.map((row) => (
            <li key={row.format} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 truncate text-muted-foreground">
                {t(RUN_FORMAT_LABEL[row.format])}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-[var(--secondary)]"
                  style={{
                    width: `${Math.round((row.count / maxRunsFormat) * 100)}%`,
                  }}
                />
              </span>
              <span className="w-8 text-end font-semibold tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
