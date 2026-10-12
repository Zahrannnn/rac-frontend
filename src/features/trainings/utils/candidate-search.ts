/** The technician-candidates endpoint only answers searches of two or more
 * characters (trimmed) — shorter input keeps the query disabled. */
export function isCandidateSearchReady(search: string): boolean {
  return search.trim().length >= 2;
}
