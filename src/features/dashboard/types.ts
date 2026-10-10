import type { TranslationKey } from "@/shared/i18n";

export type WorkshopStatus = "Draft" | "Submitted" | "Complete" | "Incomplete";

export type StatusCount = { status: WorkshopStatus; count: number };
export type GovernorateCount = { governorate: string; count: number };

/** Program pulse — the latest participation run's ranked pool toward the recommended
 * target (ADR-0004: the old Scored-count pulse died with the manual model). */
export type DashboardPulse = {
  rankedCount: number;
  recommendedTarget: number;
};

/** Full attention strip (PM / NOU / SuperAdmin). */
export type DashboardAttention = {
  incompleteFailing: number;
  stuckDrafts: number;
  /** Complete-survey workshops missing from the latest participation run's ranked set. */
  awaitingSelectionCount: number;
};

/** FieldTeams slim attention — assignment-scoped ops only. */
export type AssignedDashboardAttention = {
  incompleteFailing: number;
};

/** Week-3 Part C: non-Draft survey briefs for the full shape. */
export type SurveySummaryBrief = {
  workshopId: string;
  workshopCode: string;
  status: Exclude<WorkshopStatus, "Draft">;
  failingRules: number;
};

/** SuperAdmin / ProjectManager / Nou — the operational KPI set. */
export type FullDashboardSummary = {
  totalWorkshops: number;
  totalTechnicians: number;
  workshopsLast30Days: number;
  byStatus: StatusCount[];
  byGovernorate: GovernorateCount[];
  surveys: SurveySummaryBrief[];
  pulse: DashboardPulse;
  attention: DashboardAttention;
};

/** Unido / TrainerViewer — totals + progress + geography + pulse. */
export type ExecutiveDashboardSummary = {
  totalWorkshops: number;
  byStatus: StatusCount[];
  byGovernorate: GovernorateCount[];
  pulse: DashboardPulse;
};

/** FieldTeams — counts scoped to the caller's active assignments. */
export type AssignedDashboardSummary = {
  myWorkshops: number;
  mySurveysDraft: number;
  mySurveysSubmitted: number;
  mySurveysComplete: number;
  mySurveysIncomplete: number;
  attention: AssignedDashboardAttention;
};

export type DashboardSummary =
  | FullDashboardSummary
  | ExecutiveDashboardSummary
  | AssignedDashboardSummary;

/** GPS pins for the dashboard geographic map (GET /dashboard/map). */
export type WorkshopMapPoint = {
  workshopId: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  governorate: string;
  district: string | null;
  status: WorkshopStatus;
  latitude: number;
  longitude: number;
};

export type DashboardMapResponse = {
  points: WorkshopMapPoint[];
};

export function isAssignedSummary(
  summary: DashboardSummary
): summary is AssignedDashboardSummary {
  return "myWorkshops" in summary;
}

export function isFullSummary(summary: DashboardSummary): summary is FullDashboardSummary {
  return "totalTechnicians" in summary;
}

/** A KPI card definition — labels come from the dictionary, never hardcoded. */
export type KpiCard = {
  labelKey: TranslationKey;
  value: number;
};
