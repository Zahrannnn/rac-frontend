import { racApi } from "@/shared/api/rac-api";
import type { PagedResult } from "@/shared/api/paged-result";
import type { Technician, TechnicianListFilters, TechnicianStatus } from "../types";

export async function fetchTechnicians(
  filters: TechnicianListFilters
): Promise<PagedResult<Technician>> {
  const { data } = await racApi.get<PagedResult<Technician>>("/technicians", {
    params: {
      page: filters.page,
      pageSize: 20,
      search: filters.search,
      workshopId: filters.workshopId,
      status: filters.status,
    },
  });
  return data;
}

export async function fetchTechnician(id: string): Promise<Technician> {
  const { data } = await racApi.get<Technician>(`/technicians/${id}`);
  return data;
}

export type CreateTechnicianPayload = {
  fullName: string;
  fullNameAr?: string;
  nationalId: string;
  mobile: string;
  workshopId: string;
  specialty?: string;
  yearsOfExperience: number;
  notes?: string;
};

export async function createTechnician(payload: CreateTechnicianPayload): Promise<Technician> {
  const { data } = await racApi.post<Technician>("/technicians", payload);
  return data;
}

export type UpdateTechnicianPayload = {
  fullName?: string;
  fullNameAr?: string | null;
  mobile?: string;
  specialty?: string | null;
  yearsOfExperience?: number;
  status?: TechnicianStatus;
  notes?: string | null;
};

export async function updateTechnician(
  id: string,
  payload: UpdateTechnicianPayload
): Promise<Technician> {
  const { data } = await racApi.patch<Technician>(`/technicians/${id}`, payload);
  return data;
}
