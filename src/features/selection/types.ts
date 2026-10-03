/** Selection module — contracts mirror SelectionEndpoints.cs exactly. */

export type RankedWorkshop = {
  rank: number;
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  governorate: string;
  totalWeighted: number;
};

export type CriterionWeight = {
  criterionKey: string;
  weightPercent: number;
};

export type WeightsResponse = {
  weights: CriterionWeight[];
  totalPercent: number;
};

/** The 7 SRS criteria, in the backend's scoring order (SelectionCriteria.Keys). */
export type CriterionField =
  | "racActivity"
  | "technicalProfile"
  | "refrigerantExposure"
  | "competencyGaps"
  | "environmentalPerformance"
  | "commitment"
  | "geographicRepresentation";

export type WorkshopScore = {
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  governorate: string;
  racActivity: number;
  technicalProfile: number;
  refrigerantExposure: number;
  competencyGaps: number;
  environmentalPerformance: number;
  commitment: number;
  geographicRepresentation: number;
  totalWeighted: number;
  notes: string | null;
  updatedAtUtc: string;
};

export type RecommendedCompany = {
  workshopId: string;
  code: string;
  name: string;
  governorate: string;
};

export type RecommendedCompaniesResponse = {
  source: string;
  count: number;
  items: RecommendedCompany[];
  selectionRunId?: string;
  runAtUtc?: string;
};

export type SelectionRunRankedRow = {
  rank: number;
  rankInGovernorate: number;
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  governorate: string;
  totalWeighted: number;
  tier: "recommended" | "reserve" | "none" | string;
};

export type SelectionRunSummary = {
  id: string;
  runAtUtc: string;
  runByUserId: string | null;
  runByUsername: string | null;
  weightsVersion: string;
  scoredCount: number;
  recommendedCount: number;
  reserveCount: number;
  notes: string | null;
};

export type SelectionRunDetail = SelectionRunSummary & {
  weights: CriterionWeight[];
  recommended: SelectionRunRankedRow[];
  reserve: SelectionRunRankedRow[];
  ranked: SelectionRunRankedRow[];
};
