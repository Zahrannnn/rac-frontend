import type { WorkshopListFilters } from "../types";

/**
 * Query-key factory for the workshops feature — the single source of truth for
 * every "workshops" cache key. Tuples mirror the literals used before the
 * factory existed so existing cache entries and cross-feature consumers keep
 * working.
 */
export const workshopsKeys = {
  /** Prefix invalidating every workshops key (lists, details, assignments, surveys). */
  all: () => ["workshops"] as const,
  list: {
    /** Prefix invalidating every list key regardless of filters. */
    all: () => ["workshops", "list"] as const,
    page: (filters: WorkshopListFilters) => ["workshops", "list", filters] as const,
  },
  detail: (id: string) => ["workshops", "detail", id] as const,
  assignments: (workshopId: string) => ["workshops", "assignments", workshopId] as const,
  survey: (workshopId: string) => ["workshops", "survey", workshopId] as const,
  /** Workshop picker options — read by cross-feature surfaces (e.g. technicians). */
  options: () => ["workshops", "options"] as const,
};
