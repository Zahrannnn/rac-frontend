import type { ReportRunFilters } from "../types";

/**
 * Query-key factory for the reports feature — the single source of truth for
 * every "reports" cache key. Tuples mirror the literals used before the
 * factory existed so existing cache entries keep working. The trainers query
 * keeps its "trainings" key (shared cache scope with the trainings feature)
 * and is consumed via `trainingKeys.trainers()`.
 */
export const reportKeys = {
  catalog: () => ["reports", "catalog"] as const,
  runs: {
    /** Prefix invalidating every runs key regardless of filters. */
    all: () => ["reports", "runs"] as const,
    list: (filters: ReportRunFilters) => ["reports", "runs", filters] as const,
  },
};
