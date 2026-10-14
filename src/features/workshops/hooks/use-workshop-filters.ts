"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { filtersToSearchParams, parseWorkshopFilters } from "../utils/filter-state";
import type { WorkshopListFilters } from "../types";

const FILTER_DEBOUNCE_MS = 400;

/**
 * Registry filter state: seeded from the URL and mirrored back on change,
 * with per-field debounced drafts for search and district (server-side
 * contains match). `setFilters` bypasses pagination reset (pager page changes);
 * `setFilter` resets to page 1 (a new filter narrows the result set).
 */
export function useWorkshopFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<WorkshopListFilters>(() =>
    parseWorkshopFilters(new URLSearchParams(searchParams.toString()))
  );
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [districtDraft, setDistrictDraft] = useState(filters.district ?? "");

  useEffect(() => {
    const query = filtersToSearchParams(filters).toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }, [filters, router]);

  useEffect(() => {
    const current = filters.search ?? "";
    if (searchDraft === current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchDraft.trim() || undefined, page: 1 }));
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [filters.search, searchDraft]);

  // District filter commits on its own debounce (server-side contains match).
  useEffect(() => {
    const current = filters.district ?? "";
    if (districtDraft === current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, district: districtDraft.trim() || undefined, page: 1 }));
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [districtDraft, filters.district]);

  const setFilter = useCallback((patch: Partial<WorkshopListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const hasFilters = Boolean(
    filters.search || filters.governorate || filters.district || filters.status || filters.page > 1
  );

  function clearFilters() {
    setSearchDraft("");
    setDistrictDraft("");
    setFilters({ page: 1 });
  }

  return {
    filters,
    setFilters,
    setFilter,
    searchDraft,
    setSearchDraft,
    districtDraft,
    setDistrictDraft,
    hasFilters,
    clearFilters,
  };
}
