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
  /** Optional — blank drafts are omitted (undefined drops at serialization). */
  nationalId?: string;
  mobile?: string;
  /** Nullable — null registers a free technician (no workshop, "بدون ورشة"). */
  workshopId: string | null;
  specialty?: string;
  yearsOfExperience: number;
  notes?: string;
  /** Registry attribute fields (REGISTRY-GAS-SPEC §1 + §11) — all optional; unset
   *  drafts are omitted (undefined drops at serialization). Gender and age never
   *  travel: they derive from the national ID (§10B). */
  employmentType?: string;
  employmentNature?: string;
  hasModernRefrigerantExperience?: boolean;
  employer?: string;
  address?: string;
};

export async function createTechnician(payload: CreateTechnicianPayload): Promise<Technician> {
  const { data } = await racApi.post<Technician>("/technicians", payload);
  return data;
}

export type UpdateTechnicianPayload = {
  fullName?: string;
  fullNameAr?: string | null;
  /** Nullable — null keeps the stored national ID (the editable form sends the
   *  prefilled value; a blank draft leaves it unchanged). */
  nationalId?: string | null;
  /** Nullable — a cleared draft clears the stored value. */
  mobile?: string | null;
  specialty?: string | null;
  yearsOfExperience?: number;
  status?: TechnicianStatus;
  notes?: string | null;
  /** Registry attribute fields (REGISTRY-GAS-SPEC §1 + §11) — three-way semantics:
   *  a value sets, "" clears the stored value, an omitted key (= null on the
   *  wire) keeps it. The §11 flag has no clear path: omitted = keep, true/false = set.
   *  Gender and age never travel: they derive from the national ID (§10B). */
  employmentType?: string | null;
  employmentNature?: string | null;
  hasModernRefrigerantExperience?: boolean;
  employer?: string | null;
  address?: string | null;
};

export async function updateTechnician(
  id: string,
  payload: UpdateTechnicianPayload
): Promise<Technician> {
  const { data } = await racApi.patch<Technician>(`/technicians/${id}`, payload);
  return data;
}
