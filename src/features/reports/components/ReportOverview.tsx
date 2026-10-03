"use client";

import { useMemo } from "react";
import { BarChart3, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiCard,
  isAssignedSummary,
  isFullSummary,
  useDashboardSummary,
  type DashboardSummary,
  type ExecutiveDashboardSummary,
  type FullDashboardSummary,
  type GovernorateCount,
  type WorkshopStatus,
} from "@/features/dashboard";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { useReportRuns } from "../hooks/use-reports";
import type { ReportRun } from "../types";

/** Analytics sample window — the runs endpoint caps pageSize at 100. */
const RUN_SAMPLE_SIZE = 100;

type OverviewKpi = { labelKey: TranslationKey; value: number };

function statusCount(
  byStatus: { status: WorkshopStatus; count: number }[],
  status: WorkshopStatus
): number {
  return byStatus.find((entry) => entry.status === status)?.count ?? 0;
}

function fullSummaryKpis(summary: FullDashboardSummary): OverviewKpi[] {
  return [
    { labelKey: "dashboard.totalWorkshops", value: summary.totalWorkshops },
    { labelKey: "status.Complete", value: statusCount(summary.byStatus, "Complete") },
    { labelKey: "status.Scored", value: statusCount(summary.byStatus, "Scored") },
    { labelKey: "dashboard.totalTechnicians", value: summary.totalTechnicians },
  ];
}

function executiveSummaryKpis(summary: ExecutiveDashboardSummary): OverviewKpi[] {
  // Executive shape (Unido / TrainerViewer): no technicians / last-30-days fields.
  return [
    { labelKey: "dashboard.totalWorkshops", value: summary.totalWorkshops },
    { labelKey: "status.Complete", value: statusCount(summary.byStatus, "Complete") },
    { labelKey: "status.Scored", value: statusCount(summary.byStatus, "Scored") },
    { labelKey: "status.Draft", value: statusCount(summary.byStatus, "Draft") },
  ];
}

function overviewKpis(summary: DashboardSummary | undefined): OverviewKpi[] {
  if (!summary || isAssignedSummary(summary)) {
    return [];
  }
  return isFullSummary(summary) ? fullSummaryKpis(summary) : executiveSummaryKpis(summary);
}

function topGovernorates(summary: DashboardSummary | undefined): GovernorateCount[] {
  if (!summary || isAssignedSummary(summary)) {
    return [];
  }
  return [...summary.byGovernorate]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Workshops-by-governorate bar list, fed by GET /dashboard/summary. */
function GovernorateChart({
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
function RunsFormatChart({
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

/**
 * Overview KPIs + analytics, fed only by real endpoints: GET /dashboard/summary
 * (role-shaped) and GET /reports/runs (perm `reports:manage`). Every figure is a
 * real field — nothing is invented client-side.
 */
export function ReportOverview({ canManage }: { canManage: boolean }) {
  const t = useT();
  const { data: summary, isPending, isError, refetch } = useDashboardSummary();
  const runs = useReportRuns({ page: 1, pageSize: RUN_SAMPLE_SIZE }, canManage);

  const kpis = useMemo(() => overviewKpis(summary), [summary]);
  const governorates = useMemo(() => topGovernorates(summary), [summary]);

  // The assigned shape has none of the national fields — render nothing rather
  // than fake KPIs (FieldTeams have no reports surface anyway).
  if (summary && isAssignedSummary(summary)) {
    return null;
  }

  return (
    <>
      <section aria-label={t("reports.overview")} className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--navy)]">{t("reports.overview")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("reports.overviewHint")}</p>
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <p>{t("common.error")}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.labelKey} labelKey={kpi.labelKey} value={kpi.value} />
            ))}
          </div>
        )}
      </section>

      <section aria-label={t("reports.runsByFormat")} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GovernorateChart
            governorates={governorates}
            isPending={isPending}
            isError={isError}
          />

          {canManage ? (
            <RunsFormatChart
              items={runs.data?.items ?? []}
              isPending={runs.isPending}
              isError={runs.isError}
            />
          ) : null}
        </div>
      </section>
    </>
  );
}
