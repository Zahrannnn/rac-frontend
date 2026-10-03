import { racApi } from "@/shared/api/rac-api";
import type { PagedResult } from "@/features/workshops/types";
import { ADMIN_PAGE_SIZE, AUDIT_PAGE_SIZE } from "../types";
import type {
  AdminUser,
  AuditFilters,
  AuditLogEntry,
  ChangeUserRolePayload,
  CreateUserPayload,
  PatchUserStatusPayload,
  ResetPasswordPayload,
  RolePermissionsRow,
  UpdateUserPayload,
  UserDetail,
  UserListFilters,
} from "../types";

// ---- Users (perm admin:users — SuperAdmin) ----

export async function fetchUsers(filters: UserListFilters): Promise<PagedResult<AdminUser>> {
  const { data } = await racApi.get<PagedResult<AdminUser>>("/admin/users", {
    params: { page: filters.page, pageSize: ADMIN_PAGE_SIZE },
  });
  return data;
}

export async function fetchUser(id: string): Promise<UserDetail> {
  const { data } = await racApi.get<UserDetail>(`/admin/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
  const { data } = await racApi.post<AdminUser>("/admin/users", payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUser> {
  const { data } = await racApi.put<AdminUser>(`/admin/users/${id}`, payload);
  return data;
}

export async function changeUserRole(
  id: string,
  payload: ChangeUserRolePayload
): Promise<AdminUser> {
  const { data } = await racApi.put<AdminUser>(`/admin/users/${id}/role`, payload);
  return data;
}

export async function patchUserStatus(
  id: string,
  payload: PatchUserStatusPayload
): Promise<AdminUser> {
  const { data } = await racApi.patch<AdminUser>(`/admin/users/${id}/status`, payload);
  return data;
}

export async function resetUserPassword(
  id: string,
  payload: ResetPasswordPayload
): Promise<{ id: string; username: string; detail: string }> {
  const { data } = await racApi.post<{ id: string; username: string; detail: string }>(
    `/admin/users/${id}/reset-password`,
    payload
  );
  return data;
}

// ---- Permission matrix (perm admin:permissions — SuperAdmin) ----

export async function fetchPermissionMatrix(): Promise<RolePermissionsRow[]> {
  const { data } = await racApi.get<RolePermissionsRow[]>("/admin/permissions");
  return data;
}

export async function updateRolePermissions(
  role: string,
  permissions: string[]
): Promise<RolePermissionsRow> {
  const { data } = await racApi.put<RolePermissionsRow>(
    `/admin/permissions/${encodeURIComponent(role)}`,
    { permissions }
  );
  return data;
}

// ---- Audit log (perm admin:audit — SuperAdmin, view for PM) ----

export async function fetchAuditLogs(filters: AuditFilters): Promise<PagedResult<AuditLogEntry>> {
  const { data } = await racApi.get<PagedResult<AuditLogEntry>>("/admin/audit-logs", {
    params: {
      page: filters.page,
      pageSize: AUDIT_PAGE_SIZE,
      entityName: filters.entityName,
      action: filters.action,
      username: filters.username,
    },
  });
  return data;
}


