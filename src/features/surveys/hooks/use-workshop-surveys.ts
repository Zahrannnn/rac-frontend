"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchWorkshopSurvey, workshopsKeys, type WorkshopSurvey } from "@/features/workshops";

/** One workshop row's survey status in the registry (null = none started). */
export type SurveyStatusEntry = {
  survey: WorkshopSurvey | null;
  isPending: boolean;
};

/** Enrich a page of workshops with per-workshop survey status (404 → none). */
export function useWorkshopSurveys(workshopIds: string[]) {
  return useQueries({
    queries: workshopIds.map((workshopId) => ({
      queryKey: workshopsKeys.survey(workshopId),
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
