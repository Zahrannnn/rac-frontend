"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KpiCard,
  isAssignedSummary,
  isFullSummary,
  isTrainerSummary,
  useDashboardSummary,
  type DashboardSummary,
  type ExecutiveDashboardSummary,
  type FullDashboardSummary,
  type GovernorateCount,
  type WorkshopStatus,
} from "@/features/dashboard";
import { useT, type TranslationKey } from "@/shared/i18n";
import { useReportRuns } from "../hooks/use-reports";
import { GovernorateChart, RunsFormatChart } from "./ReportOverviewCharts";

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
    { labelKey: "dashboard.totalTechnicians", value: summary.totalTechnicians },
  ];
}

function executiveSummaryKpis(summary: ExecutiveDashboardSummary): OverviewKpi[] {
  // Executive shape (Unido): no technicians / last-30-days fields.
  return [
    { labelKey: "dashboard.totalWorkshops", value: summary.totalWorkshops },
    { labelKey: "status.Complete", value: statusCount(summary.byStatus, "Complete") },
    { labelKey: "status.Draft", value: statusCount(summary.byStatus, "Draft") },
  ];
}

/** The reports overview covers the national workshop pipeline only — the
 * assigned (FieldTeams) and trainer shapes have no workshop geography. */
function isNationalSummary(
  summary: DashboardSummary
): summary is FullDashboardSummary | ExecutiveDashboardSummary {
  return !isAssignedSummary(summary) && !isTrainerSummary(summary);
}

function overviewKpis(summary: DashboardSummary | undefined): OverviewKpi[] {
  if (!summary || !isNationalSummary(summary)) {
    return [];
  }
  return isFullSummary(summary) ? fullSummaryKpis(summary) : executiveSummaryKpis(summary);
}

function topGovernorates(summary: DashboardSummary | undefined): GovernorateCount[] {
  if (!summary || !isNationalSummary(summary)) {
    return [];
  }
  return [...summary.byGovernorate]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
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
