"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTechnician,
  fetchTechnician,
  fetchTechnicians,
  updateTechnician,
  type CreateTechnicianPayload,
  type UpdateTechnicianPayload,
} from "../api/technicians-adapter";
import type { TechnicianListFilters } from "../types";

export function useTechnicians(filters: TechnicianListFilters) {
  return useQuery({
    queryKey: ["technicians", "list", filters],
    queryFn: () => fetchTechnicians(filters),
    placeholderData: (previous) => previous,
  });
}

export function useTechnician(id: string) {
  return useQuery({
    queryKey: ["technicians", "detail", id],
    queryFn: () => fetchTechnician(id),
    retry: false,
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTechnicianPayload) => createTechnician(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians", "list"] });
    },
  });
}

export function useUpdateTechnician(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTechnicianPayload) => updateTechnician(id, payload),
    onSuccess: (technician) => {
      queryClient.setQueryData(["technicians", "detail", id], technician);
      void queryClient.invalidateQueries({ queryKey: ["technicians", "list"] });
    },
  });
}
