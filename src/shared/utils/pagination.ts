/** Page count for a paged result — at least 1, rounding up partial pages. */
export function totalPagesOf(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
