"use client";

import { useEffect, useState } from "react";
import type { AuditFilters } from "../types";

/**
 * Owns the free-text drafts and their debounce so AuditFiltersPanel stays
 * focused on rendering. Drafts re-sync whenever the URL rewrites filters.
 */
export function useAuditTextFilters(
  filters: AuditFilters,
  onFiltersChange: (next: AuditFilters) => void
) {
  const [entityDraft, setEntityDraft] = useState(filters.entityName ?? "");
  const [userDraft, setUserDraft] = useState(filters.username ?? "");
  const [prevFilters, setPrevFilters] = useState(filters);

  // Keep drafts in sync when the URL changes the filters (render-time adjustment).
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setEntityDraft(filters.entityName ?? "");
    setUserDraft(filters.username ?? "");
  }

  // Debounced commit of the free-text filters.
  useEffect(() => {
    if (
      (entityDraft.trim() || undefined) === filters.entityName &&
      (userDraft.trim() || undefined) === filters.username
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      onFiltersChange({
        page: 1,
        entityName: entityDraft.trim() || undefined,
        action: filters.action,
        username: userDraft.trim() || undefined,
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [entityDraft, userDraft, filters.entityName, filters.action, filters.username, onFiltersChange]);

  return { entityDraft, setEntityDraft, userDraft, setUserDraft };
}
