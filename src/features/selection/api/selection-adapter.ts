import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/shared/api/paged-result";
import type {
  RecommendedCompaniesResponse,
  ScorecardResponse,
  SelectionRunDetail,
  SelectionRunSummary,
  RubricKind,
} from "../types";

export async function fetchSelectionRuns(
  page = 1,
  pageSize = 10
): Promise<PagedResult<SelectionRunSummary>> {
  const { data } = await racApi.get<PagedResult<SelectionRunSummary>>("/selection/runs", {
    params: { page, pageSize },
  });
  return data;
}

export async function fetchSelectionRun(runId: string): Promise<SelectionRunDetail> {
  const { data } = await racApi.get<SelectionRunDetail>(`/selection/runs/${runId}`);
  return data;
}

/** Creates an immutable machine-scored run snapshot. The backend answers 409 when there is
 * nothing to rank (participation: no Complete surveys; equipment: no participation run). */
export async function createSelectionRun(
  kind: RubricKind,
  notes?: string
): Promise<SelectionRunDetail> {
  const { data } = await racApi.post<SelectionRunDetail>("/selection/runs", {
    kind,
    notes: notes ?? null,
  });
  return data;
}

export async function exportSelectionRun(
  runId: string
): Promise<{ blob: Blob; fileName: string }> {
  return downloadBlob(racApi, `/selection/runs/${runId}/export`, `selection-run-${runId}.xlsx`);
}

export async function fetchRecommendedCompanies(): Promise<RecommendedCompaniesResponse> {
  const { data } = await racApi.get<RecommendedCompaniesResponse>(
    "/selection/recommended-companies"
  );
  return data;
}

/**
 * Live machine-scored rubric breakdown of one workshop. The backend answers 409 when the
 * workshop is not scorable for the kind (participation: no Complete survey; equipment: not
 * in the latest participation run's recommended set) — callers render that as an
 * explanatory empty state, not an error toast.
 */
export async function fetchScorecard(
  workshopId: string,
  kind: RubricKind
): Promise<ScorecardResponse> {
  const { data } = await racApi.get<ScorecardResponse>(
    `/workshops/${workshopId}/scorecard`,
    { params: { kind } }
  );
  return data;
}
