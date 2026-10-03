"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUserRole,
  createUser,
  fetchAuditLogs,
  fetchPermissionMatrix,
  fetchUser,
  fetchUsers,
  patchUserStatus,
  resetUserPassword,
  updateRolePermissions,
  updateUser,
} from "../api/admin-adapter";
import type {
  AuditFilters,
  ChangeUserRolePayload,
  CreateUserPayload,
  PatchUserStatusPayload,
  ResetPasswordPayload,
  UpdateUserPayload,
  UserListFilters,
} from "../types";

/** Shared opt-in flags for the read hooks — the hub gates queries by permission. */
export type ListQueryOptions = { enabled?: boolean };

export function useUsers(filters: UserListFilters, options?: ListQueryOptions) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => fetchUsers(filters),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => fetchUser(id!),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useChangeUserRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeUserRolePayload) => changeUserRole(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function usePatchUserStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatchUserStatusPayload) => patchUserStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useResetUserPassword(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetUserPassword(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", id] });
    },
  });
}

export function usePermissionMatrix(options?: ListQueryOptions) {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: fetchPermissionMatrix,
    enabled: options?.enabled,
  });
}

/** Whole-row save used by the matrix grid — one mutation, role supplied per call. */
export function useSaveRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      updateRolePermissions(role, permissions),
    onSuccess: (row) => {
      queryClient.setQueryData<{ role: string; permissions: string[] }[]>(["admin", "permissions"], (old) =>
        old ? old.map((existing) => (existing.role === row.role ? row : existing)) : old
      );
    },
  });
}

export function useAuditLogs(filters: AuditFilters, options?: ListQueryOptions) {
  return useQuery({
    queryKey: ["admin", "audit", filters],
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: (previous) => previous,
    enabled: options?.enabled,
  });
}


