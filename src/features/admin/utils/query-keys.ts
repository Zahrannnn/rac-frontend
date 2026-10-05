import type { AuditFilters, UserListFilters } from "../types";

/**
 * Query-key factory for the admin feature — the single source of truth for
 * every "admin" cache key. Tuples mirror the literals used before the factory
 * existed so existing cache entries and cross-feature consumers keep working.
 */
export const adminKeys = {
  users: {
    /** Prefix invalidating every users key (list, details, field teams). */
    all: () => ["admin", "users"] as const,
    list: (filters: UserListFilters) => ["admin", "users", filters] as const,
    detail: (id: string | null) => ["admin", "users", "detail", id] as const,
    /** Field-team user list — read by cross-feature surfaces (e.g. workshops). */
    fieldTeams: () => ["admin", "users", "fieldteams"] as const,
  },
  permissions: () => ["admin", "permissions"] as const,
  audit: (filters: AuditFilters) => ["admin", "audit", filters] as const,
};
