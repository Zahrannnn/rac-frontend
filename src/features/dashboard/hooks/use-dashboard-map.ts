"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMap } from "../api/dashboard-adapter";
import type { DashboardFilterState } from "../utils/dashboard-filters";
import { DEFAULT_FILTERS } from "../utils/dashboard-filters";

export function useDashboardMap(filters: DashboardFilterState = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: ["dashboard", "map", filters.governorate, filters.district, filters.status],
    queryFn: () => fetchDashboardMap(filters),
    staleTime: 60_000,
  });
}
