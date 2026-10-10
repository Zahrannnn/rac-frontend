"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSelectionRun,
  exportSelectionRun,
  fetchRecommendedCompanies,
  fetchScorecard,
  fetchSelectionRun,
  fetchSelectionRuns,
} from "../api/selection-adapter";
import type { RubricKind } from "../types";
import { selectionKeys } from "../utils/query-keys";

export function useSelectionRuns(page = 1) {
  return useQuery({
    queryKey: selectionKeys.runs.page(page),
    queryFn: () => fetchSelectionRuns(page, 10),
  });
}

export function useSelectionRun(runId: string | null) {
  return useQuery({
    queryKey: selectionKeys.runs.detail(runId),
    queryFn: () => fetchSelectionRun(runId!),
    enabled: Boolean(runId),
  });
}

/** Gated server-side by the "selection:run" permission. */
export function useCreateSelectionRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, notes }: { kind: RubricKind; notes?: string }) =>
      createSelectionRun(kind, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: selectionKeys.runs.all() });
      void queryClient.invalidateQueries({ queryKey: selectionKeys.recommendedCompanies() });
    },
  });
}

export function useExportSelectionRun() {
  return useMutation({
    mutationFn: (runId: string) => exportSelectionRun(runId),
  });
}

export function useRecommendedCompanies() {
  return useQuery({
    queryKey: selectionKeys.recommendedCompanies(),
    queryFn: fetchRecommendedCompanies,
  });
}

/**
 * Live scorecard for the scorecard dialog. 409 (workshop not scorable for the kind)
 * is an expected outcome — `retry: false` and the dialog renders the explanatory
 * empty state from the error status instead of an error surface.
 */
export function useScorecard(workshopId: string | null, kind: RubricKind) {
  return useQuery({
    queryKey: selectionKeys.scorecard(workshopId, kind),
    queryFn: () => fetchScorecard(workshopId!, kind),
    enabled: Boolean(workshopId),
    retry: false,
  });
}
