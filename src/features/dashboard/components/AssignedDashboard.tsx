"use client";

import { useState } from "react";
import { useT } from "@/shared/i18n";
import {
  DEFAULT_FILTERS,
  filterStatuses,
  type DashboardFilterState,
} from "../utils/dashboard-filters";
import type { AssignedDashboardSummary, StatusCount } from "../types";
import { AttentionStrip } from "./AttentionStrip";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardHero } from "./DashboardHero";
import { DashboardWorkshopsMap } from "./DashboardWorkshopsMap";
import { GovernorateRanking } from "./GovernorateRanking";
import { LifecycleStepper } from "./LifecycleStepper";
import { StatusBreakdown } from "./StatusBreakdown";

/** FieldTeams — assignment-scoped KPIs + slim attention (no national pulse). */
export function AssignedDashboard({ summary }: { summary: AssignedDashboardSummary }) {
  const t = useT();
  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_FILTERS);

  const byStatus: StatusCount[] = [
    { status: "Draft", count: summary.mySurveysDraft },
    { status: "Submitted", count: summary.mySurveysSubmitted },
    { status: "Complete", count: summary.mySurveysComplete },
    { status: "Incomplete", count: summary.mySurveysIncomplete },
  ];

  const filteredStatuses = filterStatuses(byStatus, filters.status);
  const heroValue =
    filters.status === "all" ? summary.myWorkshops : (filteredStatuses[0]?.count ?? 0);

  const assignedProgress =
    summary.myWorkshops > 0
      ? Math.round((summary.mySurveysComplete / summary.myWorkshops) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <DashboardFilters value={filters} onChange={setFilters} showGovernorate={false} />

      <DashboardHero
        titleKey="dashboard.myWorkshops"
        value={heroValue}
        insight={t("dashboard.insightAssigned")}
        progressPercent={assignedProgress}
        showNextStep={summary.myWorkshops === 0 || summary.attention.incompleteFailing > 0}
        nextStepHref="/workshops"
        nextStepLabelKey="dashboard.openMyWorkshops"
        supporting={[
          { labelKey: "dashboard.mySurveysDraft", value: summary.mySurveysDraft },
          { labelKey: "dashboard.mySurveysSubmitted", value: summary.mySurveysSubmitted },
          { labelKey: "dashboard.mySurveysComplete", value: summary.mySurveysComplete },
          { labelKey: "dashboard.mySurveysIncomplete", value: summary.mySurveysIncomplete },
        ]}
      />

      <AttentionStrip attention={summary.attention} includeOfficeChips={false} />

      <DashboardWorkshopsMap filters={filters} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <GovernorateRanking byGovernorate={[]} unavailable />
        <LifecycleStepper
          byStatus={byStatus}
          activeStatus={filters.status}
          onSelectStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
      </div>

      <StatusBreakdown byStatus={filteredStatuses} />
    </div>
  );
}
