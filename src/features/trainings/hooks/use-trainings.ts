"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  addAttendee,
  createTraining,
  deleteTraining,
  deleteTrainingPhoto,
  fetchTechnicianCandidates,
  fetchTraining,
  fetchTrainingPhotos,
  fetchTrainings,
  removeAttendee,
  updateAttendee,
  updateTraining,
  uploadTrainingPhoto,
} from "../api/trainings-adapter";
import { isCandidateSearchReady } from "../utils/candidate-search";
import { trainingKeys } from "../utils/query-keys";
import type {
  AddAttendeePayload,
  CreateTrainingPayload,
  TrainingListFilters,
  UpdateAttendeePayload,
  UpdateTrainingPayload,
} from "../types";

/** Any trainings write invalidates the whole feature cache (list, details, photos). */
function invalidateTrainings(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: trainingKeys.all() });
}

export function useTrainings(filters: TrainingListFilters) {
  return useQuery({
    queryKey: trainingKeys.list.page(filters),
    queryFn: () => fetchTrainings(filters),
    placeholderData: (previous) => previous,
  });
}

export function useTraining(id: string | null) {
  return useQuery({
    queryKey: trainingKeys.detail(id),
    queryFn: () => fetchTraining(id!),
    enabled: Boolean(id),
    // A 404 (missing, or outside a trainer's scope) is final; don't retry it.
    retry: (failureCount, error) =>
      (error as { status?: number }).status !== 404 && failureCount < 1,
  });
}

export function useTrainingPhotos(trainingId: string | null) {
  return useQuery({
    queryKey: trainingKeys.photos(trainingId),
    queryFn: () => fetchTrainingPhotos(trainingId!),
    enabled: Boolean(trainingId),
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrainingPayload) => createTraining(payload),
    onSuccess: () => invalidateTrainings(queryClient),
  });
}

export function useUpdateTraining(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTrainingPayload) => updateTraining(id, payload),
    onSuccess: () => invalidateTrainings(queryClient),
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: () => invalidateTrainings(queryClient),
  });
}

export function useAttendeeMutations(trainingId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trainingKeys.detail(trainingId) });
    void queryClient.invalidateQueries({ queryKey: trainingKeys.list.all() });
  };

  return {
    add: useMutation({
      mutationFn: (payload: AddAttendeePayload) => addAttendee(trainingId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        attendeeId,
        payload,
      }: {
        attendeeId: string;
        payload: UpdateAttendeePayload;
      }) => updateAttendee(trainingId, attendeeId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (attendeeId: string) => removeAttendee(trainingId, attendeeId),
      onSuccess: invalidate,
    }),
  };
}

/** Participant-picker candidates — the purpose-built endpoint only answers
 * searches of two or more characters, so shorter terms keep the query idle.
 * Previous results stay visible while a refined term loads (no flicker). */
export function useTechnicianCandidates(search: string) {
  return useQuery({
    queryKey: trainingKeys.technicianCandidates(search),
    queryFn: () => fetchTechnicianCandidates(search),
    enabled: isCandidateSearchReady(search),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useTrainingPhotoMutations(trainingId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trainingKeys.photos(trainingId) });
    void queryClient.invalidateQueries({ queryKey: trainingKeys.detail(trainingId) });
    void queryClient.invalidateQueries({ queryKey: trainingKeys.list.all() });
  };

  return {
    upload: useMutation({
      mutationFn: (file: File) => uploadTrainingPhoto(trainingId, file),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (photoId: string) => deleteTrainingPhoto(trainingId, photoId),
      onSuccess: invalidate,
    }),
  };
}
