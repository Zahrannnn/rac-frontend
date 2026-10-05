"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCatalog, fetchRuns, fetchTrainers, generateReport } from "../api/reports-adapter";
import type { ReportFilters, ReportRunFilters } from "../types";
import { reportKeys } from "../utils/query-keys";
import { trainingKeys } from "@/features/trainings";

export function useReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: fetchCatalog,
  });
}

/** Options for the training-records report's trainer select. */
export function useTrainers() {
  return useQuery({
    queryKey: trainingKeys.trainers(),
    queryFn: fetchTrainers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReportRuns(filters: ReportRunFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.runs.list(filters),
    queryFn: () => fetchRuns(filters),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      filters,
    }: {
      key: string;
      filters?: ReportFilters;
    }) => generateReport(key, filters),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.runs.all() });
    },
  });
}
