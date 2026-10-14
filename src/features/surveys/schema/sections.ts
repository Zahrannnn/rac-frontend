// Transcription of the authoritative field questionnaire
// "UNIDO_MAC_Field_Questionnaire_Final_AR Ver3" — no invented fields.
// Ver3 shape: 3 pilot governorates (Cairo / Giza / Qalyubia) and a 5-band
// cars-per-month table (<20 / 20–49 / 50–99 / 100–200 / >200).
// Axis sections (order 2–9) are Likert tables transcribed from the paper
// questionnaire (one mark per row); axis 8 also carries a 12-item priority
// ranking (1–5) and 8 operational challenges (3-level). Closing signatures were
// removed from the questionnaire (customer decision 2026-10-14); legacy stored
// answers may still carry the old signature keys and are ignored.
// Labels live in i18n (survey.field.*, survey.opt.*, survey.row.*, survey.col.*,
// survey.item.*, survey.statement.*).

import type { SectionSpec } from "./types";
import { CONSENT_SECTION, INTAKE_SECTIONS } from "./sections-intake";
import { AXIS_SECTIONS } from "./sections-axes";
import { CLOSING_SECTIONS } from "./sections-closing";

export const SECTIONS: readonly SectionSpec[] = [
  ...INTAKE_SECTIONS,
  ...AXIS_SECTIONS,
  ...CLOSING_SECTIONS,
];

/** The 13 wizard steps in order: consent first, then schema order. */
export const WIZARD_STEPS: readonly SectionSpec[] = [CONSENT_SECTION, ...SECTIONS];

export function sectionByStep(stepIndex: number): SectionSpec {
  return WIZARD_STEPS[stepIndex];
}
