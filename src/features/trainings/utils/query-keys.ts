import type { TrainingListFilters } from "../types";

/**
 * Query-key factory for the trainings feature — the single source of truth for
 * every "trainings" cache key. Tuples mirror the literals used before the
 * factory existed so existing cache entries and cross-feature consumers keep
 * working. Pre-seeded by the Lead during the repos-split port so the reports
 * feature can consume `trainers()` before the workshop-cluster pass lands.
 */
export const trainingKeys = {
  /** Prefix invalidating every trainings key (lists, details, photos, trainers). */
  all: () => ["trainings"] as const,
  list: {
    /** Prefix invalidating every list key regardless of filters. */
    all: () => ["trainings", "list"] as const,
    page: (filters: TrainingListFilters) => ["trainings", "list", filters] as const,
  },
  detail: (id: string | null) => ["trainings", "detail", id] as const,
  photos: (trainingId: string | null) => ["trainings", "photos", trainingId] as const,
  /** Distinct trainers of the caller's sessions — reports' trainer filter options. */
  trainers: () => ["trainings", "trainers"] as const,
};
