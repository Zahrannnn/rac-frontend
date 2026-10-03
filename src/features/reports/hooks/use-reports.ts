"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCatalog, fetchRuns, generateReport } from "../api/reports-adapter";
import type { ReportFilters, ReportRunFilters } from "../types";

export function useReportCatalog() {
  return useQuery({
    queryKey: ["reports", "catalog"],
    queryFn: fetchCatalog,
  });
}

export function useReportRuns(filters: ReportRunFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "runs", filters],
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
      void queryClient.invalidateQueries({ queryKey: ["reports", "runs"] });
    },
  });
}
