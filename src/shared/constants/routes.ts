import type { Route } from "next";

export const routes = {
  welcome: "/",
  login: "/auth/login",
  dashboard: "/dashboard",
  workshops: "/workshops",
  technicians: "/technicians",
  surveys: "/surveys",
  selection: "/selection",
  trainings: "/trainings",
  equipmentDeliveries: "/equipment-deliveries",
  reports: "/reports",
  admin: "/admin",
  health: "/health",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

/**
 * Dynamic-route helpers for workshop deep links (typedRoutes-validated).
 * Keep building new workshop URLs through these instead of inline templates.
 */
export function workshopProfile(id: string): Route {
  return `/workshops/${id}` as Route;
}

export function workshopEdit(id: string): Route {
  return `/workshops/${id}/edit` as Route;
}
