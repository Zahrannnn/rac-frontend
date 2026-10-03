import { racApi } from "@/shared/api/rac-api";
import type { SubmitResult, SurveyPhoto, SurveyRecord } from "../types";

export async function startSurvey(workshopId: string): Promise<SurveyRecord> {
  const { data } = await racApi.post<SurveyRecord>(`/workshops/${workshopId}/survey`);
  return data;
}

export async function fetchSurveyForWorkshop(workshopId: string): Promise<SurveyRecord | null> {
  try {
    const { data } = await racApi.get<SurveyRecord>(`/workshops/${workshopId}/survey`);
    return data;
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/** PUT /surveys/{id}/sections/{key} — body is the section's DataJson object. */
export async function saveSection(
  surveyId: string,
  key: string,
  data: Record<string, unknown>
): Promise<SurveyRecord> {
  const { data: survey } = await racApi.put<SurveyRecord>(
    `/surveys/${surveyId}/sections/${key}`,
    data
  );
  return survey;
}

export async function recordGps(
  surveyId: string,
  latitude: number,
  longitude: number
): Promise<SurveyRecord> {
  const { data } = await racApi.put<SurveyRecord>(`/surveys/${surveyId}/gps`, {
    latitude,
    longitude,
  });
  return data;
}

export async function submitSurvey(surveyId: string): Promise<SubmitResult> {
  const { data } = await racApi.post<SubmitResult>(`/surveys/${surveyId}/submit`);
  return data;
}

export async function listPhotos(surveyId: string): Promise<SurveyPhoto[]> {
  const { data } = await racApi.get<SurveyPhoto[]>(`/surveys/${surveyId}/photos`);
  return data;
}

export async function uploadPhoto(
  surveyId: string,
  file: File,
  sectionKey?: string
): Promise<SurveyPhoto> {
  const form = new FormData();
  form.append("file", file);
  if (sectionKey) {
    form.append("sectionKey", sectionKey);
  }

  const { data } = await racApi.post<SurveyPhoto>(`/surveys/${surveyId}/photos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deletePhoto(surveyId: string, photoId: string): Promise<void> {
  await racApi.delete(`/surveys/${surveyId}/photos/${photoId}`);
}

export function photoUrl(surveyId: string, photoId: string): string {
  const base = racApi.defaults.baseURL ?? "";
  return `${base}/surveys/${surveyId}/photos/${photoId}`;
}
