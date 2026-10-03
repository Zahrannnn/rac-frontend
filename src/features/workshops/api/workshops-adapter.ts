import { racApi } from "@/shared/api/rac-api";
import { WORKSHOPS_PAGE_SIZE } from "../utils/filter-state";
import type {
  Assignment,
  CreateWorkshopResponse,
  DuplicateCheckResponse,
  PagedResult,
  Workshop,
  WorkshopListFilters,
  WorkshopSurvey,
  WorkshopType,
} from "../types";

export async function fetchWorkshops(
  filters: WorkshopListFilters
): Promise<PagedResult<Workshop>> {
  const { data } = await racApi.get<PagedResult<Workshop>>("/workshops", {
    params: {
      page: filters.page,
      pageSize: WORKSHOPS_PAGE_SIZE,
      search: filters.search,
      governorate: filters.governorate,
      district: filters.district,
      status: filters.status,
    },
  });
  return data;
}

export async function fetchWorkshop(id: string): Promise<Workshop> {
  const { data } = await racApi.get<Workshop>(`/workshops/${id}`);
  return data;
}

/** The duplicate probe — fields mirror CheckDuplicatesRequest exactly. */
export type DuplicateProbe = {
  nameEn: string;
  ownerName: string;
  mobile: string;
  address: string;
  governorate: string;
  latitude: number | null;
  longitude: number | null;
};

export async function checkDuplicates(probe: DuplicateProbe): Promise<DuplicateCheckResponse> {
  const { data } = await racApi.post<DuplicateCheckResponse>(
    "/workshops/check-duplicates",
    probe
  );
  return data;
}

export type CreateWorkshopPayload = DuplicateProbe & {
  nameAr?: string;
  telephone?: string;
  district?: string;
  type: WorkshopType;
  activities?: string;
  numberOfTechnicians: number | null;
  notes?: string;
  confirmDuplicate: boolean;
};

export async function createWorkshop(
  payload: CreateWorkshopPayload
): Promise<CreateWorkshopResponse> {
  const { data } = await racApi.post<CreateWorkshopResponse>("/workshops", payload);
  return data;
}

export type UpdateWorkshopPayload = {
  nameEn?: string;
  nameAr?: string | null;
  ownerName?: string;
  mobile?: string;
  telephone?: string | null;
  address?: string;
  governorate?: string;
  district?: string | null;
  type?: WorkshopType;
  status?: Workshop["status"];
  activities?: string | null;
  numberOfTechnicians?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  confirmDuplicate?: boolean;
};

export async function updateWorkshop(
  id: string,
  payload: UpdateWorkshopPayload
): Promise<Workshop> {
  const { data } = await racApi.patch<Workshop>(`/workshops/${id}`, payload);
  return data;
}

export async function fetchAssignments(workshopId: string): Promise<Assignment[]> {
  const { data } = await racApi.get<Assignment[]>(`/workshops/${workshopId}/assignments`);
  return data;
}

export async function assignUser(workshopId: string, userId: string): Promise<Assignment> {
  const { data } = await racApi.post<Assignment>(`/workshops/${workshopId}/assignments`, {
    userId,
  });
  return data;
}

export async function unassignUser(
  workshopId: string,
  assignmentId: string
): Promise<Assignment> {
  const { data } = await racApi.delete<Assignment>(
    `/workshops/${workshopId}/assignments/${assignmentId}`
  );
  return data;
}

/** 404s when the workshop has no survey yet — callers treat that as "none". */
export async function fetchWorkshopSurvey(workshopId: string): Promise<WorkshopSurvey | null> {
  try {
    const { data } = await racApi.get<WorkshopSurvey>(`/workshops/${workshopId}/survey`);
    return data;
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
