/** Selection module — contracts mirror SelectionContracts.cs / SelectionRunSnapshot.cs
 * exactly (ADR-0004: machine-scored rubrics; NO manual scores or weights). */

export type RubricKind = "participation" | "equipment";

export type SelectionRunRankedRow = {
  rank: number;
  rankInGovernorate: number;
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  governorate: string;
  totalScore: number;
  tier: "recommended" | "reserve" | "none" | string;
  criteria: { key: string; points: number; bandLabelKey: string }[];
};

export type SelectionRunSummary = {
  id: string;
  runAtUtc: string;
  runByUserId: string | null;
  runByUsername: string | null;
  kind: RubricKind;
  rubricVersion: string;
  rankedCount: number;
  recommendedCount: number;
  reserveCount: number;
  notes: string | null;
};

/** The rubric definition frozen at run time (immutable snapshot payload). */
export type RubricSnapshotBand = { bandKey: string; points: number };
export type RubricSnapshotCriterion = {
  key: string;
  maxPoints: number;
  bands: RubricSnapshotBand[];
};
export type RubricSnapshotDefinition = {
  version: string;
  kind: string;
  maxTotal: number;
  criteria: RubricSnapshotCriterion[];
};

export type SelectionRunDetail = SelectionRunSummary & {
  rubric: RubricSnapshotDefinition;
  recommended: SelectionRunRankedRow[];
  reserve: SelectionRunRankedRow[];
  ranked: SelectionRunRankedRow[];
};

// ---- Live scorecard (GET /workshops/{id}/scorecard?kind=…) ----

export type ScorecardSource = {
  sectionKey: string;
  fieldKey: string;
  displayValue: string | null;
};

export type ScorecardCriterion = {
  key: string;
  labelKey: string;
  points: number;
  maxPoints: number;
  bandLabelKey: string;
  source: ScorecardSource;
};

export type ScorecardResponse = {
  workshopId: string;
  kind: RubricKind;
  rubricVersion: string;
  total: number;
  maxTotal: number;
  computedAtUtc: string;
  criteria: ScorecardCriterion[];
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
  /** Present when the list comes from a selection run (participation | equipment). */
  kind?: RubricKind;
  rubricVersion?: string;
};
