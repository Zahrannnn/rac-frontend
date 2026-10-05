import { KeyRound, ScrollText, Users, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import { canAny } from "@/features/auth";

export type AdminSurfaceKey = "users" | "permissions" | "audit";

export type AdminSurfaceDef = {
  key: AdminSurfaceKey;
  href: Route;
  labelKey: "admin.tabUsers" | "admin.tabPermissions" | "admin.tabAudit";
  descKey: "admin.tabUsersDesc" | "admin.tabPermissionsDesc" | "admin.tabAuditDesc";
  anyOf: readonly string[];
  icon: LucideIcon;
};

export const ADMIN_SURFACES: readonly AdminSurfaceDef[] = [
  {
    key: "users",
    href: "/admin/users" as Route,
    labelKey: "admin.tabUsers",
    descKey: "admin.tabUsersDesc",
    anyOf: ["admin:users"],
    icon: Users,
  },
  {
    key: "permissions",
    href: "/admin/permissions" as Route,
    labelKey: "admin.tabPermissions",
    descKey: "admin.tabPermissionsDesc",
    anyOf: ["admin:permissions"],
    icon: KeyRound,
  },
  {
    key: "audit",
    href: "/admin/audit" as Route,
    labelKey: "admin.tabAudit",
    descKey: "admin.tabAuditDesc",
    anyOf: ["admin:audit"],
    icon: ScrollText,
  },
];

/** Surfaces the caller may enter, in fixed order. */
export function visibleSurfaces(permissions: readonly string[]): AdminSurfaceDef[] {
  return ADMIN_SURFACES.filter((surface) => canAny(permissions, surface.anyOf));
}
