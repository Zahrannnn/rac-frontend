// Mirrors rac-backend Features/Workshops/WorkshopContracts.cs — do not invent fields.

export type WorkshopStatus = "Draft" | "Submitted" | "Complete" | "Incomplete";

export type WorkshopType = "Formal" | "Informal" | "Freelance" | "AuthorizedServiceCenter" | "Other";

export type WorkshopFlags = "None" | "DuplicateSuspected" | "NotRelevant";

/** Allowed lifecycle transitions (Domain/WorkshopStatus.cs WorkshopLifecycle). */
/**
 * MANUAL transition targets per status. Mirrors the backend's WorkshopLifecycle
 * (ADR-0004: Complete is terminal — the former Scored state was demolished).
 */
export const LIFECYCLE_TRANSITIONS: Record<WorkshopStatus, WorkshopStatus[]> = {
  Draft: ["Submitted"],
  Submitted: ["Complete", "Incomplete"],
  Incomplete: ["Submitted"],
  Complete: [],
};

/**
 * The lifecycle order used by the profile timeline stepper; doubles as the
 * canonical status enumeration (list filters validate against it).
 */
export const LIFECYCLE_ORDER: readonly WorkshopStatus[] = [
  "Draft",
  "Submitted",
  "Complete",
  "Incomplete",
];

export type Workshop = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string | null;
  ownerName: string;
  mobile: string;
  telephone: string | null;
  address: string;
  governorate: string;
  district: string | null;
  type: WorkshopType;
  status: WorkshopStatus;
  flags: WorkshopFlags;
  activities: string | null;
  numberOfTechnicians: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

export type DuplicateMatch = {
  workshopId: string;
  code: string;
  name: string;
  governorate: string;
  reasons: string[];
};

export type DuplicateCheckResponse = {
  duplicates: DuplicateMatch[];
};

export type CreateWorkshopResponse = {
  workshop: Workshop;
  duplicateWarnings: DuplicateMatch[];
};

export type WorkshopListFilters = {
  page: number;
  search?: string;
  governorate?: string;
  district?: string;
  status?: WorkshopStatus;
};

export type Assignment = {
  id: string;
  workshopId: string;
  userId: string;
  username: string;
  assignedAtUtc: string;
  endedAtUtc: string | null;
};

export type WorkshopSurvey = {
  id: string;
  workshopId: string;
  workshopCode: string;
  status: "Draft" | "Submitted" | "Complete" | "Incomplete";
  latitude: number | null;
  longitude: number | null;
  gpsRecordedAtUtc: string | null;
  submittedAtUtc: string | null;
  submittedBy: string | null;
  photoCount: number;
  createdAtUtc: string;
  completedAtUtc: string | null;
};
