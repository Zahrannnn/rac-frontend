/**
 * Query-key factory for the health feature — the single source of truth for
 * the "health" cache key. The tuple mirrors the literal used before the
 * factory existed so existing cache entries keep working.
 */
export const healthKeys = {
  status: () => ["health"] as const,
};
