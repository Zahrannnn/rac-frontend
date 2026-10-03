/** Administration module — contracts mirror Users/Permissions/Audit endpoints. */

export type UserRole =
  | "SuperAdmin"
  | "ProjectManager"
  | "Nou"
  | "Unido"
  | "TrainerViewer"
  | "FieldTeams";

export const USER_ROLES: readonly UserRole[] = [
  "SuperAdmin",
  "ProjectManager",
  "Nou",
  "Unido",
  "TrainerViewer",
  "FieldTeams",
];

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

export type UserActivityItem = {
  action: string;
  entity: string;
  occurredAtUtc: string;
};

export type UserDetail = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAtUtc: string | null;
  createdAtUtc: string;
  assignedWorkshopCount: number | null;
  recentActivity: UserActivityItem[];
};

export type UserListFilters = { page: number };

export type CreateUserPayload = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  phone?: string | null;
};

export type UpdateUserPayload = {
  fullName: string;
  email: string;
  phone?: string | null;
};

export type ChangeUserRolePayload = {
  role: UserRole;
  confirm: true;
};

export type PatchUserStatusPayload = {
  isActive: boolean;
};

export type ResetPasswordPayload = {
  newPassword: string;
};

export type RolePermissionsRow = {
  role: string;
  permissions: string[];
};

export type AuditAction = "Added" | "Modified" | "Deleted";

export const AUDIT_ACTIONS: readonly AuditAction[] = ["Added", "Modified", "Deleted"];

export type AuditLogEntry = {
  id: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  username: string | null;
  /** Changes JSON: { field: { from, to } } for Modified, flat snapshots otherwise. */
  changes: Record<string, unknown>;
  atUtc: string;
};

export type AuditFilters = {
  page: number;
  entityName?: string;
  action?: AuditAction;
  username?: string;
};


export const ADMIN_PAGE_SIZE = 20;
export const AUDIT_PAGE_SIZE = 50;
