/** Training Records — contracts mirror TrainingsEndpoints.cs (Addendum 2). */

export type TrainingAttendee = {
  id: string;
  technicianId: string;
  technicianName: string;
  preScore: number | null;
  postScore: number | null;
  createdAtUtc: string;
};

export type TrainingListItem = {
  id: string;
  trainerName: string;
  trainerKey?: string | null;
  title?: string | null;
  venue: string;
  governorate: string;
  startAtUtc: string;
  endAtUtc: string;
  /** Absent for TrainerViewer list items (privacy). */
  attendeeCount?: number;
  photoCount?: number;
};

export type TrainingDetails = {
  id: string;
  trainerName: string;
  trainerKey?: string | null;
  title?: string | null;
  venue: string;
  governorate: string;
  startAtUtc: string;
  endAtUtc: string;
  notes?: string | null;
  /** Absent on TrainerViewer detail (privacy). */
  attendees?: TrainingAttendee[];
  photoCount: number;
  createdAtUtc?: string;
  updatedAtUtc?: string | null;
};

export type TrainingPhoto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId?: string | null;
  uploadedAtUtc?: string | null;
};

export type TrainingListFilters = {
  page: number;
  governorate?: string;
  dateFrom?: string;
  dateTo?: string;
  trainerKey?: string;
};

export type CreateTrainingPayload = {
  trainerName: string;
  trainerKey?: string | null;
  title?: string | null;
  venue: string;
  governorate: string;
  startAtUtc: string;
  endAtUtc: string;
  notes?: string | null;
};

export type UpdateTrainingPayload = {
  trainerName?: string;
  trainerKey?: string | null;
  title?: string | null;
  venue?: string;
  governorate?: string;
  startAtUtc?: string;
  endAtUtc?: string;
  notes?: string | null;
};

export type AddAttendeePayload = {
  technicianId: string;
  preScore?: number | null;
  postScore?: number | null;
};
