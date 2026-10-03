"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePhoto,
  fetchSurveyForWorkshop,
  listPhotos,
  recordGps,
  saveSection,
  startSurvey,
  submitSurvey,
  uploadPhoto,
} from "../api/surveys-adapter";

export function useSurvey(workshopId: string) {
  return useQuery({
    queryKey: ["surveys", "for-workshop", workshopId],
    queryFn: () => fetchSurveyForWorkshop(workshopId),
    retry: false,
  });
}

export function useStartSurvey(workshopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startSurvey(workshopId),
    onSuccess: (survey) => {
      queryClient.setQueryData(["surveys", "for-workshop", workshopId], survey);
    },
  });
}

/** Save one section's DataJson and replace the cached survey. */
export function useSaveSection(surveyId: string, workshopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: Record<string, unknown> }) =>
      saveSection(surveyId, key, data),
    onSuccess: (survey) => {
      queryClient.setQueryData(["surveys", "for-workshop", workshopId], survey);
    },
  });
}

export function useRecordGps(surveyId: string, workshopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      recordGps(surveyId, latitude, longitude),
    onSuccess: (survey) => {
      queryClient.setQueryData(["surveys", "for-workshop", workshopId], survey);
    },
  });
}

export function useSubmitSurvey(surveyId: string, workshopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitSurvey(surveyId),
    onSuccess: () => {
      // Cross-surface consistency (Week-3 Part C): the workshop profile's
      // survey card and the role-shaped dashboards must reflect the new
      // Complete/Incomplete state on their next fetch.
      void queryClient.invalidateQueries({ queryKey: ["surveys", "for-workshop", workshopId] });
      void queryClient.invalidateQueries({ queryKey: ["workshops", "detail", workshopId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useSurveyPhotos(surveyId: string | undefined) {
  return useQuery({
    queryKey: ["surveys", "photos", surveyId],
    queryFn: () => listPhotos(surveyId!),
    enabled: Boolean(surveyId),
  });
}

export function usePhotoMutations(surveyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["surveys", "photos", surveyId] });

  const upload = useMutation({
    mutationFn: ({ file, sectionKey }: { file: File; sectionKey?: string }) =>
      uploadPhoto(surveyId, file, sectionKey),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (photoId: string) => deletePhoto(surveyId, photoId),
    onSuccess: invalidate,
  });

  return { upload, remove };
}
