"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignUser,
  checkDuplicates,
  createWorkshop,
  fetchAssignments,
  fetchWorkshop,
  fetchWorkshopSurvey,
  fetchWorkshops,
  unassignUser,
  updateWorkshop,
  type CreateWorkshopPayload,
  type DuplicateProbe,
  type UpdateWorkshopPayload,
} from "../api/workshops-adapter";
import type { WorkshopListFilters } from "../types";

export function useWorkshops(filters: WorkshopListFilters) {
  return useQuery({
    queryKey: ["workshops", "list", filters],
    queryFn: () => fetchWorkshops(filters),
    placeholderData: (previous) => previous,
  });
}

export function useWorkshop(id: string) {
  return useQuery({
    queryKey: ["workshops", "detail", id],
    queryFn: () => fetchWorkshop(id),
    retry: false,
  });
}

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: (probe: DuplicateProbe) => checkDuplicates(probe),
  });
}

export function useCreateWorkshop() {
  return useMutation({ mutationFn: (payload: CreateWorkshopPayload) => createWorkshop(payload) });
}

export function useUpdateWorkshop(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateWorkshopPayload) => updateWorkshop(id, payload),
    onSuccess: (workshop) => {
      queryClient.setQueryData(["workshops", "detail", id], workshop);
      void queryClient.invalidateQueries({ queryKey: ["workshops", "list"] });
    },
    // 409 = someone changed the workshop concurrently — re-sync from the
    // server so the UI shows the real current state before the user retries.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["workshops", "detail", id] });
    },
  });
}

export function useAssignments(workshopId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["workshops", "assignments", workshopId],
    queryFn: () => fetchAssignments(workshopId),
    enabled,
  });
}

export function useAssignmentMutations(workshopId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["workshops", "assignments", workshopId] });

  const assign = useMutation({
    mutationFn: (userId: string) => assignUser(workshopId, userId),
    onSuccess: invalidate,
  });

  const unassign = useMutation({
    mutationFn: (assignmentId: string) => unassignUser(workshopId, assignmentId),
    onSuccess: invalidate,
  });

  return { assign, unassign };
}

export function useWorkshopSurvey(workshopId: string) {
  return useQuery({
    queryKey: ["workshops", "survey", workshopId],
    queryFn: () => fetchWorkshopSurvey(workshopId),
    retry: false,
  });
}
