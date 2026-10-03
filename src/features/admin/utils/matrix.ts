import type { RolePermissionsRow } from "../types";

/**
 * Canonical ordering of the permission space, mirroring the backend's
 * RolePermission.Functions × Actions (absence of a row means denied, except
 * the SuperAdmin "*" bypass which is enforced server-side, never stored).
 */
const FUNCTION_ORDER = [
  "workshops",
  "technicians",
  "surveys",
  "selection",
  "reports",
  "admin",
  "trainings",
  "equipment",
];

const ACTION_ORDER = [
  "view",
  "create",
  "edit",
  "delete",
  "score",
  "assign",
  "manage",
  "generate",
  "users",
  "audit",
  "permissions",
];

function permissionRank(permission: string): number {
  const [func, action] = permission.split(":");
  const funcRank = FUNCTION_ORDER.indexOf(func);
  const actionRank = ACTION_ORDER.indexOf(action);
  return (funcRank < 0 ? FUNCTION_ORDER.length : funcRank) * 100 + (actionRank < 0 ? ACTION_ORDER.length : actionRank);
}

/** Columns of the matrix grid — every permission granted to at least one role, canonically ordered. */
export function matrixColumns(rows: RolePermissionsRow[]): string[] {
  const granted = new Set<string>();
  for (const row of rows) {
    for (const permission of row.permissions) {
      granted.add(permission);
    }
  }
  return [...granted].sort((a, b) => permissionRank(a) - permissionRank(b));
}

export type PermissionGroup = { func: string; permissions: string[] };

/** Contiguous function groups over the canonically-ordered columns. */
export function groupColumns(columns: string[]): PermissionGroup[] {
  const groups: PermissionGroup[] = [];
  for (const permission of columns) {
    const func = permission.split(":")[0];
    const last = groups.at(-1);
    if (last && last.func === func) {
      last.permissions.push(permission);
    } else {
      groups.push({ func, permissions: [permission] });
    }
  }
  return groups;
}

/** Rows of the matrix grid — roles in UserRole declaration order. */
export function matrixRows(rows: RolePermissionsRow[]): RolePermissionsRow[] {
  return [...rows].sort((a, b) => a.role.localeCompare(b.role));
}

/** Pure checkbox toggle on a role's granted list (no duplicates). */
export function togglePermission(granted: string[], permission: string): string[] {
  if (granted.includes(permission)) {
    return granted.filter((item) => item !== permission);
  }
  return [...granted, permission].sort((a, b) => permissionRank(a) - permissionRank(b));
}

/** The whole-row PUT payload — a clean, de-duplicated grant list. */
export function rowPayload(granted: string[]): string[] {
  return [...new Set(granted)];
}
