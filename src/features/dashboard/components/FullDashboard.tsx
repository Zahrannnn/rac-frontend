"use client";

import { useT } from "@/shared/i18n";
import { progressPercent, type DashboardFilterState } from "../utils/dashboard-filters";
import { buildDashboardInsight } from "../utils/dashboard-insight";
import type { FullDashboardSummary } from "../types";
import { AttentionStrip } from "./AttentionStrip";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardPipelineHero } from "./DashboardPipelineHero";
import { DashboardWorkshopsMap } from "./DashboardWorkshopsMap";
import { GovernorateRanking } from "./GovernorateRanking";
import { TrainingStatsSection } from "./TrainingStatsSection";

type FullDashboardProps = {
  summary: FullDashboardSummary;
  filters: DashboardFilterState;
  onFiltersChange: (next: DashboardFilterState) => void;
};

/** SuperAdmin / ProjectManager / Nou — pulse + attention + geography. */
export function FullDashboard({ summary, filters, onFiltersChange }: FullDashboardProps) {
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
            labelKey: "dashboard.totalTechnicians",
            value: summary.totalTechnicians,
          },
          {
            labelKey: "dashboard.workshopsLast30Days",
            value: summary.workshopsLast30Days,
            hintKey: "dashboard.workshopsLast30DaysHint",
          },
          {
            labelKey: "dashboard.surveysComplete",
            value: progress,
            suffix: "%",
          },
        ]}
      />

      <AttentionStrip
        attention={summary.attention}
        includeOfficeChips
        surveyBriefs={summary.surveys}
      />

      <GovernorateRanking
        byGovernorate={summary.byGovernorate}
        selected={filters.governorate}
        onSelect={(governorate) => onFiltersChange({ ...filters, governorate })}
      />

      <TrainingStatsSection />

      <DashboardWorkshopsMap filters={filters} />
    </div>
  );
}
