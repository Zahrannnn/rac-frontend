import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/features/workshops/types";
import type {
  CriterionWeight,
  RankedWorkshop,
  RecommendedCompaniesResponse,
  SelectionRunDetail,
  SelectionRunSummary,
  WeightsResponse,
  WorkshopScore,
} from "../types";

export async function fetchRanking(): Promise<RankedWorkshop[]> {
  const { data } = await racApi.get<RankedWorkshop[]>("/selection/ranking");
  return data;
}

export async function fetchWeights(): Promise<WeightsResponse> {
  const { data } = await racApi.get<WeightsResponse>("/selection/weights");
  return data;
}

export async function updateWeights(weights: CriterionWeight[]): Promise<WeightsResponse> {
  const { data } = await racApi.put<WeightsResponse>("/selection/weights", { weights });
  return data;
}

/** Enters/updates validator criterion scores — requires the workshop's survey Complete
 * (the backend answers 409 otherwise). The server computes the weighted total. */
export async function saveWorkshopScore(
  workshopId: string,
  scores: Omit<
    WorkshopScore,
    "workshopId" | "workshopCode" | "workshopName" | "governorate" | "totalWeighted" | "updatedAtUtc"
  >
): Promise<WorkshopScore> {
  const { data } = await racApi.put<WorkshopScore>(`/workshops/${workshopId}/score`, scores);
  return data;
}

/** 404 when the workshop has no recorded score — callers treat that as "none". */
export async function fetchWorkshopScore(workshopId: string): Promise<WorkshopScore | null> {
  try {
    const { data } = await racApi.get<WorkshopScore>(`/workshops/${workshopId}/score`);
    return data;
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchRecommendedCompanies(): Promise<RecommendedCompaniesResponse> {
  const { data } = await racApi.get<RecommendedCompaniesResponse>(
    "/selection/recommended-companies"
  );
  return data;
}

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

export async function createSelectionRun(notes?: string): Promise<SelectionRunDetail> {
  const { data } = await racApi.post<SelectionRunDetail>("/selection/runs", {
    notes: notes ?? null,
  });
  return data;
}

export async function exportSelectionRun(
  runId: string
): Promise<{ blob: Blob; fileName: string }> {
  return downloadBlob(racApi, `/selection/runs/${runId}/export`, `selection-run-${runId}.xlsx`);
}
