"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSelectionRun,
  saveWorkshopScore,
  exportSelectionRun,
  fetchRanking,
  fetchRecommendedCompanies,
  fetchSelectionRun,
  fetchSelectionRuns,
  fetchWeights,
  fetchWorkshopScore,
  updateWeights,
} from "../api/selection-adapter";
import type { CriterionWeight } from "../types";

export function useRanking() {
  return useQuery({
    queryKey: ["selection", "ranking"],
    queryFn: fetchRanking,
  });
}

export function useWeights() {
  return useQuery({
    queryKey: ["selection", "weights"],
    queryFn: fetchWeights,
  });
}

export function useUpdateWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weights: CriterionWeight[]) => updateWeights(weights),
    onSuccess: (response) => {
      queryClient.setQueryData(["selection", "weights"], response);
      // Re-weighted totals change every weighted score server-side.
      void queryClient.invalidateQueries({ queryKey: ["selection", "ranking"] });
    },
  });
}

export function useWorkshopScore(workshopId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["selection", "score", workshopId],
    queryFn: () => fetchWorkshopScore(workshopId),
    enabled,
    retry: false,
  });
}

export function useSaveWorkshopScore(workshopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scores: Parameters<typeof saveWorkshopScore>[1]) =>
      saveWorkshopScore(workshopId, scores),
    onSuccess: (score) => {
      queryClient.setQueryData(["selection", "score", workshopId], score);
      // A new score row changes the ranking pool and the awaiting-scoring list.
      void queryClient.invalidateQueries({ queryKey: ["selection", "ranking"] });
      void queryClient.invalidateQueries({ queryKey: ["selection", "awaiting-scoring"] });
    },
  });
}

export function useRecommendedCompanies() {
  return useQuery({
    queryKey: ["selection", "recommended-companies"],
    queryFn: fetchRecommendedCompanies,
  });
}

export function useSelectionRuns(page = 1) {
  return useQuery({
    queryKey: ["selection", "runs", page],
    queryFn: () => fetchSelectionRuns(page, 10),
  });
}

export function useSelectionRun(runId: string | null) {
  return useQuery({
    queryKey: ["selection", "runs", "detail", runId],
    queryFn: () => fetchSelectionRun(runId!),
    enabled: Boolean(runId),
  });
}

export function useCreateSelectionRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notes?: string) => createSelectionRun(notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["selection", "runs"] });
      void queryClient.invalidateQueries({ queryKey: ["selection", "ranking"] });
      void queryClient.invalidateQueries({ queryKey: ["selection", "recommended-companies"] });
    },
  });
}

export function useExportSelectionRun() {
  return useMutation({
    mutationFn: (runId: string) => exportSelectionRun(runId),
  });
}
