"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "../api/dashboard-adapter";
import type { DashboardFilterState } from "../utils/dashboard-filters";
import { DEFAULT_FILTERS } from "../utils/dashboard-filters";
import { dashboardKeys } from "../utils/query-keys";

export function useDashboardSummary(filters: DashboardFilterState = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: dashboardKeys.summary.forFilters(filters),
    queryFn: () => fetchDashboardSummary(filters),
    staleTime: 60_000,
    retry: false,
  });
}
