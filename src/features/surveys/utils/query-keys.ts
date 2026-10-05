/**
 * Query-key factory for the surveys feature — the single source of truth for
 * every "surveys" cache key. Tuples mirror the literals used before the
 * factory existed so existing cache entries keep working.
 */
export const surveysKeys = {
  /** Prefix invalidating every surveys key (per-workshop surveys, photos). */
  all: () => ["surveys"] as const,
  forWorkshop: (workshopId: string) => ["surveys", "for-workshop", workshopId] as const,
  photos: (surveyId: string | undefined) => ["surveys", "photos", surveyId] as const,
};
