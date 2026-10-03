"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "../api/dashboard-adapter";
import type { DashboardFilterState } from "../utils/dashboard-filters";
import { DEFAULT_FILTERS } from "../utils/dashboard-filters";

export function useDashboardSummary(filters: DashboardFilterState = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: ["dashboard", "summary", filters.governorate, filters.district, filters.status],
    queryFn: () => fetchDashboardSummary(filters),
    staleTime: 60_000,
    retry: false,
  });
}
