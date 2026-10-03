import type { WorkshopType } from "../types";

/** The four registration wizard steps in walk order (dictionary keys). */
export const WIZARD_STEP_KEYS = [
  "wizard.step1",
  "wizard.step2",
  "wizard.step3",
  "wizard.step4",
] as const;

export const WIZARD_STEP_DESCRIPTIONS = [
  "wizard.step1Desc",
  "wizard.step2Desc",
  "wizard.step3Desc",
  "wizard.step4Desc",
] as const;

export const WORKSHOP_TYPES: WorkshopType[] = [
  "Formal",
  "Informal",
  "Freelance",
  "AuthorizedServiceCenter",
  "Other",
];
