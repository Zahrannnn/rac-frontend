"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import type { DashboardFilterState } from "../utils/dashboard-filters";
import {
  dashboardFiltersToSearchParams,
  parseDashboardFilters,
} from "../utils/dashboard-url-filters";

/**
 * URL-synced dashboard filters. The URL is the single source of truth:
 * `filters` derives from `searchParams`, and `setFilters` only navigates.
 * It runs from event handlers, never from an effect — a mount-effect
 * `router.replace` re-fetched the RSC payload, suspended the page boundary
 * and remounted the page in a loop (visible in production right after
 * login). Back/forward now update the filters for free.
 */
export function useDashboardUrlFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseDashboardFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: DashboardFilterState) => {
      const query = dashboardFiltersToSearchParams(next).toString();
      router.replace((query ? `?${query}` : window.location.pathname) as Route, {
        scroll: false,
      });
    },
    [router]
  );

  return { filters, setFilters };
}
