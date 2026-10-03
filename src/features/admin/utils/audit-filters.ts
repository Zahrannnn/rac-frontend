import { AUDIT_ACTIONS, type AuditAction, type AuditFilters } from "../types";

/** URLSearchParams → audit filters (invalid values dropped, page clamped). Pure. */
export function parseAuditFilters(params: URLSearchParams): AuditFilters {
  const pageRaw = Number.parseInt(params.get("page") ?? "1", 10);
  const entityName = params.get("entity")?.trim();
  const actionRaw = params.get("action");
  const username = params.get("user")?.trim();

  return {
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    entityName: entityName || undefined,
    action: AUDIT_ACTIONS.includes(actionRaw as AuditAction)
      ? (actionRaw as AuditAction)
      : undefined,
    username: username || undefined,
  };
}

/** Filters → query string (omits defaults so URLs stay clean). Pure. */
export function auditFiltersToQuery(filters: AuditFilters): string {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.entityName) {
    params.set("entity", filters.entityName);
  }
  if (filters.action) {
    params.set("action", filters.action);
  }
  if (filters.username) {
    params.set("user", filters.username);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
