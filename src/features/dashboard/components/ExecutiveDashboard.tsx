"use client";

import { useT } from "@/shared/i18n";
import { progressPercent, type DashboardFilterState } from "../utils/dashboard-filters";
import { buildDashboardInsight } from "../utils/dashboard-insight";
import type { ExecutiveDashboardSummary } from "../types";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardPipelineHero } from "./DashboardPipelineHero";
import { DashboardWorkshopsMap } from "./DashboardWorkshopsMap";
import { GovernorateRanking } from "./GovernorateRanking";
import { StatusBreakdown } from "./StatusBreakdown";

type ExecutiveDashboardProps = {
  summary: ExecutiveDashboardSummary;
  filters: DashboardFilterState;
  onFiltersChange: (next: DashboardFilterState) => void;
};

/** Unido / TrainerViewer — pulse + geography only (no attention strip). */
export function ExecutiveDashboard({
  summary,
  filters,
  onFiltersChange,
}: ExecutiveDashboardProps) {
  const t = useT();
  const progress = progressPercent(summary.byStatus, summary.totalWorkshops);
  const insight = buildDashboardInsight(filters, summary.totalWorkshops, t);

  return (
    <div className="flex flex-col gap-6">
      <DashboardFilters value={filters} onChange={onFiltersChange} />

      <DashboardPipelineHero
        totalWorkshops={summary.totalWorkshops}
        byStatus={summary.byStatus}
        activeStatus={filters.status}
        onSelectStatus={(status) => onFiltersChange({ ...filters, status })}
        ranked={summary.pulse.rankedCount}
        target={summary.pulse.recommendedTarget}
        insight={insight}
        showNextStep={summary.totalWorkshops === 0}
        nextStepHref="/workshops"
        nextStepLabelKey="dashboard.nextStepWorkshops"
        stats={[
          {
            labelKey: "dashboard.surveysComplete",
            value: progress,
            suffix: "%",
          },
        ]}
      />

      <GovernorateRanking
        byGovernorate={summary.byGovernorate}
        selected={filters.governorate}
        onSelect={(governorate) => onFiltersChange({ ...filters, governorate })}
      />

      <DashboardWorkshopsMap filters={filters} />

      <StatusBreakdown byStatus={summary.byStatus} />
    </div>
  );
}
