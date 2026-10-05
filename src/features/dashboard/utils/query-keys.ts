import type { DashboardFilterState } from "./dashboard-filters";

/**
 * Query-key factory for the dashboard feature — the single source of truth for
 * every "dashboard" cache key. Tuples mirror the literals used before the
 * factory existed (the summary shape is asserted by use-dashboard-summary.test.tsx).
 */
export const dashboardKeys = {
  summary: {
    /** Prefix invalidating every summary variant regardless of filters. */
    all: () => ["dashboard", "summary"] as const,
    forFilters: (filters: DashboardFilterState) =>
      ["dashboard", "summary", filters.governorate, filters.district, filters.status] as const,
  },
  map: (filters: DashboardFilterState) =>
    ["dashboard", "map", filters.governorate, filters.district, filters.status] as const,
  trainingStats: () => ["dashboard", "training-stats"] as const,
};
