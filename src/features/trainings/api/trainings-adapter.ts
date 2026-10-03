import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/features/workshops/types";
import type {
  AddAttendeePayload,
  CreateTrainingPayload,
  TrainingAttendee,
  TrainingDetails,
  TrainingListFilters,
  TrainingListItem,
  TrainingPhoto,
  UpdateTrainingPayload,
} from "../types";

export const TRAININGS_PAGE_SIZE = 20;

export async function fetchTrainings(
  filters: TrainingListFilters
): Promise<PagedResult<TrainingListItem>> {
  const { data } = await racApi.get<PagedResult<TrainingListItem>>("/trainings", {
    params: {
      page: filters.page,
      pageSize: TRAININGS_PAGE_SIZE,
      governorate: filters.governorate,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      trainerKey: filters.trainerKey,
    },
  });
  return data;
}

export async function fetchTraining(id: string): Promise<TrainingDetails> {
  const { data } = await racApi.get<TrainingDetails>(`/trainings/${id}`);
  return data;
}

export async function createTraining(payload: CreateTrainingPayload): Promise<TrainingDetails> {
  const { data } = await racApi.post<TrainingDetails>("/trainings", payload);
  return data;
}

export async function updateTraining(
  id: string,
  payload: UpdateTrainingPayload
): Promise<TrainingDetails> {
  const { data } = await racApi.put<TrainingDetails>(`/trainings/${id}`, payload);
  return data;
}

export async function deleteTraining(id: string): Promise<void> {
  await racApi.delete(`/trainings/${id}`);
}

export async function addAttendee(
  trainingId: string,
  payload: AddAttendeePayload
): Promise<TrainingAttendee> {
  const { data } = await racApi.post<TrainingAttendee>(
    `/trainings/${trainingId}/attendees`,
    payload
  );
  return data;
}

export async function removeAttendee(trainingId: string, attendeeId: string): Promise<void> {
  await racApi.delete(`/trainings/${trainingId}/attendees/${attendeeId}`);
}

export async function fetchTrainingPhotos(trainingId: string): Promise<TrainingPhoto[]> {
  const { data } = await racApi.get<TrainingPhoto[]>(`/trainings/${trainingId}/photos`);
  return data;
}

export async function uploadTrainingPhoto(
  trainingId: string,
  file: File
): Promise<TrainingPhoto> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await racApi.post<TrainingPhoto>(`/trainings/${trainingId}/photos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteTrainingPhoto(trainingId: string, photoId: string): Promise<void> {
  await racApi.delete(`/trainings/${trainingId}/photos/${photoId}`);
}

export async function downloadTrainingPhoto(
  trainingId: string,
  photoId: string,
  fileName: string
): Promise<{ blob: Blob; fileName: string }> {
  return downloadBlob(racApi, `/trainings/${trainingId}/photos/${photoId}`, fileName);
}
