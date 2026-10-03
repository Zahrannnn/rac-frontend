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
  fetchTraining,
  fetchTrainingPhotos,
  fetchTrainings,
  removeAttendee,
  updateTraining,
  uploadTrainingPhoto,
} from "../api/trainings-adapter";
import type {
  AddAttendeePayload,
  CreateTrainingPayload,
  TrainingListFilters,
  UpdateTrainingPayload,
} from "../types";

/** Any trainings write invalidates the whole feature cache (list, details, photos). */
function invalidateTrainings(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["trainings"] });
}

export function useTrainings(filters: TrainingListFilters) {
  return useQuery({
    queryKey: ["trainings", "list", filters],
    queryFn: () => fetchTrainings(filters),
    placeholderData: (previous) => previous,
  });
}

export function useTraining(id: string | null) {
  return useQuery({
    queryKey: ["trainings", "detail", id],
    queryFn: () => fetchTraining(id!),
    enabled: Boolean(id),
  });
}

export function useTrainingPhotos(trainingId: string | null) {
  return useQuery({
    queryKey: ["trainings", "photos", trainingId],
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
    void queryClient.invalidateQueries({ queryKey: ["trainings", "detail", trainingId] });
    void queryClient.invalidateQueries({ queryKey: ["trainings", "list"] });
  };

  return {
    add: useMutation({
      mutationFn: (payload: AddAttendeePayload) => addAttendee(trainingId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (attendeeId: string) => removeAttendee(trainingId, attendeeId),
      onSuccess: invalidate,
    }),
  };
}

export function useTrainingPhotoMutations(trainingId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["trainings", "photos", trainingId] });
    void queryClient.invalidateQueries({ queryKey: ["trainings", "detail", trainingId] });
    void queryClient.invalidateQueries({ queryKey: ["trainings", "list"] });
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
