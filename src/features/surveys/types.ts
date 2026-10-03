// Mirrors rac-backend Features/Surveys contracts (incl. Part A validation).

export type SurveyStatus = "Draft" | "Submitted" | "Complete" | "Incomplete";

export type ValidationEntry = {
  ruleKey: string;
  sectionKey: string | null;
  passed: boolean;
  detail: string;
};

export type SubmitResult = {
  status: SurveyStatus;
  validation: ValidationEntry[];
  completedAtUtc: string | null;
};

/** sections maps section keys to the RAW stored JSON string. */
export type SurveyRecord = {
  id: string;
  workshopId: string;
  workshopCode: string;
  status: SurveyStatus;
  latitude: number | null;
  longitude: number | null;
  gpsRecordedAtUtc: string | null;
  submittedAtUtc: string | null;
  submittedBy: string | null;
  sections: Record<string, string>;
  photoCount: number;
  createdAtUtc: string;
  completedAtUtc: string | null;
  validation: ValidationEntry[];
};

export type SurveyPhoto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  capturedAtUtc: string | null;
  /** Survey section the photo belongs to (null = uploaded without a section). */
  sectionKey: string | null;
};
