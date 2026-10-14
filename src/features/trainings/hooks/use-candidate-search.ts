"use client";

import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { isCandidateSearchReady, normalizeCandidateSearch } from "../utils/candidate-search";
import { useTechnicianCandidates } from "./use-trainings";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Debounced technician-candidate search for the participant picker, reduced
 * to the view states the picker renders. `settling` covers both the debounce
 * window and an in-flight refetch, while previous results stay listed.
 */
export function useCandidateSearch(query: string) {
  const normalized = normalizeCandidateSearch(query);
  const debounced = useDebouncedValue(normalized, SEARCH_DEBOUNCE_MS);
  const typedReady = isCandidateSearchReady(normalized);
  const { data, isFetching, isError, refetch } = useTechnicianCandidates(debounced);

  const settling = typedReady && (normalized !== debounced || isFetching);
  const candidates =
    typedReady && isCandidateSearchReady(debounced) && !isError ? (data ?? []) : [];

  return {
    typedReady,
    settling,
    candidates,
    firstLoad: typedReady && !isError && !data,
    showError: typedReady && isError && !settling,
    showEmpty: typedReady && !settling && !isError && data?.length === 0,
    refetch,
  };
}
