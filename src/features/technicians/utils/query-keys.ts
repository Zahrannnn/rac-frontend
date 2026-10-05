import type { TechnicianListFilters } from "../types";

/**
 * Query-key factory for the technicians feature — the single source of truth
 * for every "technicians" cache key. Tuples mirror the literals used before
 * the factory existed so existing cache entries keep working.
 */
export const technicianKeys = {
  /** Prefix invalidating every technicians key (lists, details). */
  all: () => ["technicians"] as const,
  list: {
    /** Prefix invalidating every list key regardless of filters. */
    all: () => ["technicians", "list"] as const,
    page: (filters: TechnicianListFilters) => ["technicians", "list", filters] as const,
  },
  detail: (id: string) => ["technicians", "detail", id] as const,
};
