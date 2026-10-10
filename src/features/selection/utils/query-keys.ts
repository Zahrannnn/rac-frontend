/**
 * Query-key factory for the selection feature — the single source of truth for
 * every "selection" cache key.
 */
export const selectionKeys = {
  recommendedCompanies: () => ["selection", "recommended-companies"] as const,
  scorecard: (workshopId: string | null, kind: string) =>
    ["selection", "scorecard", workshopId, kind] as const,
  runs: {
    /** Prefix invalidating every runs key (pages + details). */
    all: () => ["selection", "runs"] as const,
    page: (page: number) => ["selection", "runs", page] as const,
    detail: (runId: string | null) => ["selection", "runs", "detail", runId] as const,
  },
};
