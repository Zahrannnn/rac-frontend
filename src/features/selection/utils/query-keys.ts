/**
 * Query-key factory for the selection feature — the single source of truth for
 * every "selection" cache key. Tuples mirror the literals used before the
 * factory existed so existing cache entries keep working.
 */
export const selectionKeys = {
  ranking: () => ["selection", "ranking"] as const,
  weights: () => ["selection", "weights"] as const,
  awaitingScoring: () => ["selection", "awaiting-scoring"] as const,
  score: (workshopId: string) => ["selection", "score", workshopId] as const,
  recommendedCompanies: () => ["selection", "recommended-companies"] as const,
  runs: {
    /** Prefix invalidating every runs key (pages + details). */
    all: () => ["selection", "runs"] as const,
    page: (page: number) => ["selection", "runs", page] as const,
    detail: (runId: string | null) => ["selection", "runs", "detail", runId] as const,
  },
};
