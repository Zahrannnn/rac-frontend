import type {
  ExecutiveDashboardSummary,
  FullDashboardSummary,
  GovernorateCount,
  StatusCount,
  SurveySummaryBrief,
  WorkshopStatus,
} from "../types";

export type DashboardFilterState = {
  governorate: string | "all";
  /** Free-text district (server does a case-insensitive contains match); "all" = unset. */
  district: string | "all";
  status: WorkshopStatus | "all";
};

export const DEFAULT_FILTERS: DashboardFilterState = {
  governorate: "all",
  district: "all",
  status: "all",
};

/** Program lifecycle order — mirrors the backend state machine. */
export const WORKSHOP_STATUSES: WorkshopStatus[] = [
  "Draft",
  "Submitted",
  "Complete",
  "Incomplete",
  "Scored",
];

/** Complete/Incomplete counts + the failing subset, in one pass over the list. */
export type SurveyMetrics = {
  complete: number;
  incomplete: number;
  failing: SurveySummaryBrief[];
};

export function surveyMetrics(surveys: SurveySummaryBrief[]): SurveyMetrics {
  const metrics: SurveyMetrics = { complete: 0, incomplete: 0, failing: [] };

  for (const survey of surveys) {
    if (survey.status === "Complete") {
      metrics.complete += 1;
    } else if (survey.status === "Incomplete") {
      metrics.incomplete += 1;
      if (survey.failingRules > 0) {
        metrics.failing.push(survey);
      }
    }
  }

  return metrics;
}

export function statusCountMap(byStatus: StatusCount[]): Record<WorkshopStatus, number> {
  const map: Record<WorkshopStatus, number> = {
    Draft: 0,
    Submitted: 0,
    Complete: 0,
    Incomplete: 0,
    Scored: 0,
  };
  for (const entry of byStatus) {
    map[entry.status] = entry.count;
  }
  return map;
}

/** Share of workshops in Complete + Scored (program “progress” signal). */
export function progressPercent(byStatus: StatusCount[], totalWorkshops: number): number {
  if (totalWorkshops <= 0) {
    return 0;
  }
  const counts = statusCountMap(byStatus);
  const advanced = counts.Complete + counts.Scored;
  return Math.round((advanced / totalWorkshops) * 100);
}

export function filterGovernorates(
  byGovernorate: GovernorateCount[],
  governorate: DashboardFilterState["governorate"]
): GovernorateCount[] {
  if (governorate === "all") {
    return byGovernorate;
  }
  return byGovernorate.filter((entry) => entry.governorate === governorate);
}

export function filterStatuses(
  byStatus: StatusCount[],
  status: DashboardFilterState["status"]
): StatusCount[] {
  if (status === "all") {
    return byStatus;
  }
  return byStatus.filter((entry) => entry.status === status);
}

export function filterSurveys(
  surveys: SurveySummaryBrief[],
  status: DashboardFilterState["status"]
): SurveySummaryBrief[] {
  if (status === "all") {
    return surveys;
  }
  if (status === "Draft") {
    return [];
  }
  return surveys.filter((entry) => entry.status === status);
}

export function filteredWorkshopTotal(
  summary: FullDashboardSummary | ExecutiveDashboardSummary,
  filters: DashboardFilterState
): number {
  if (filters.governorate !== "all") {
    const match = summary.byGovernorate.find((g) => g.governorate === filters.governorate);
    return match?.count ?? 0;
  }
  if (filters.status !== "all") {
    const match = summary.byStatus.find((s) => s.status === filters.status);
    return match?.count ?? 0;
  }
  return summary.totalWorkshops;
}
