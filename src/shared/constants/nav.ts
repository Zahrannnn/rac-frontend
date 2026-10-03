import {
  ClipboardList,
  Factory,
  FileBarChart,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/shared/i18n";
import { routes, type AppRoute } from "./routes";

export type NavItem = {
  labelKey: TranslationKey;
  href: AppRoute;
  icon: LucideIcon;
  /**
   * Permission keys — the item is visible when ANY is granted.
   * Empty array = visible to every authenticated role.
   */
  anyOf: readonly string[];
  /**
   * Dev-only items show in development/test but are hidden
   * from the sidebar when NODE_ENV === "production".
   * Routes stay reachable by URL — only nav hides them.
   */
  devOnly?: boolean;
};

export const navItems: readonly NavItem[] = [
  { labelKey: "nav.dashboard", href: routes.dashboard, icon: LayoutDashboard, anyOf: [] },
  { labelKey: "nav.workshops", href: routes.workshops, icon: Factory, anyOf: ["workshops:view"] },
  {
    labelKey: "nav.technicians",
    href: routes.technicians,
    icon: Wrench,
    anyOf: ["technicians:view"],
  },
  { labelKey: "nav.surveys", href: routes.surveys, icon: ClipboardList, anyOf: ["surveys:view"] },
  {
    labelKey: "nav.selection",
    href: routes.selection,
    icon: FileCheck2,
    anyOf: ["selection:view"],
  },
  {
    labelKey: "nav.trainings",
    href: routes.trainings,
    icon: GraduationCap,
    anyOf: ["trainings:view"],
  },
  {
    labelKey: "nav.equipment",
    href: routes.equipmentDeliveries,
    icon: Package,
    anyOf: ["equipment:view"],
  },
  {
    labelKey: "nav.reports",
    href: routes.reports,
    icon: FileBarChart,
    anyOf: ["reports:generate"],
  },
  {
    labelKey: "nav.administration",
    href: routes.admin,
    icon: ShieldCheck,
    anyOf: ["admin:users", "admin:audit", "admin:permissions"],
  },
];

/**
 * Pure nav filter — visible when anyOf is empty (all roles) or the permission
 * list grants at least one key ("*" grants everything).
 * Dev-only items are hidden when NODE_ENV === "production".
 */
export function filterNavItems(
  items: readonly NavItem[],
  permissions: readonly string[]
): NavItem[] {
  const grantsAll = permissions.includes("*");
  const isProduction = process.env.NODE_ENV === "production";

  return items.filter(
    (item) =>
      (!item.devOnly || !isProduction) &&
      (grantsAll || item.anyOf.length === 0 || item.anyOf.some((key) => permissions.includes(key)))
  );
}
