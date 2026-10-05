/**
 * Shared API envelope for every paginated list endpoint (`/api/v1` convention).
 * Feature-agnostic on purpose: features parameterize it with their own item
 * types and must not re-declare or re-home it (it lived in workshops/types
 * before, which made six features import "workshops" for a generic shape).
 */
export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};
