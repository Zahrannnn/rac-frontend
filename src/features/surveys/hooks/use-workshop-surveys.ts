"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchWorkshopSurvey } from "@/features/workshops/api/workshops-adapter";
import type { WorkshopSurvey } from "@/features/workshops/types";

/** One workshop row's survey status in the registry (null = none started). */
export type SurveyStatusEntry = {
  survey: WorkshopSurvey | null;
  isPending: boolean;
};

/** Enrich a page of workshops with per-workshop survey status (404 → none). */
export function useWorkshopSurveys(workshopIds: string[]) {
  return useQueries({
    queries: workshopIds.map((workshopId) => ({
      queryKey: ["workshops", "survey", workshopId] as const,
      queryFn: () => fetchWorkshopSurvey(workshopId),
      retry: false,
      staleTime: 30_000,
    })),
  });
}

export function surveyByWorkshopId(
  workshopIds: string[],
  results: { data?: WorkshopSurvey | null; isPending: boolean }[]
): Map<string, SurveyStatusEntry> {
  const map = new Map<string, SurveyStatusEntry>();
  workshopIds.forEach((id, index) => {
    const result = results[index];
    map.set(id, {
      survey: result?.data ?? null,
      isPending: result?.isPending ?? false,
    });
  });
  return map;
}
