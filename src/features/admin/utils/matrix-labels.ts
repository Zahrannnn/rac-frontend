import type { TranslationKey } from "@/shared/i18n";

/** Function part of a permission → dictionary label for the matrix group header. */
const FUNC_LABELS: Record<string, TranslationKey> = {
  workshops: "nav.workshops",
  technicians: "nav.technicians",
  surveys: "nav.surveys",
  selection: "nav.selection",
  reports: "nav.reports",
  admin: "admin.title",
  trainings: "admin.func.trainings",
  equipment: "admin.func.equipment",
};

/** Action part of a permission → short dictionary label for the column header. */
const ACTION_LABELS: Record<string, TranslationKey> = {
  view: "admin.action.view",
  create: "admin.action.create",
  edit: "admin.action.edit",
  delete: "admin.action.delete",
  score: "admin.action.score",
  assign: "admin.action.assign",
  manage: "admin.action.manage",
  generate: "admin.action.generate",
  users: "admin.action.users",
  audit: "admin.action.audit",
  permissions: "admin.action.permissions",
};

export function functionLabelKey(func: string): TranslationKey {
  return FUNC_LABELS[func] ?? "admin.func.unknown";
}

/** Null for unknown actions — the caller falls back to the raw action text. */
export function actionLabelKey(permission: string): TranslationKey | null {
  const action = permission.split(":")[1] ?? "";
  return ACTION_LABELS[action] ?? null;
}
