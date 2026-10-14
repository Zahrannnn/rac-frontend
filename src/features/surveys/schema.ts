// Questionnaire schema, split into cohesive modules (types / constants /
// label keys / section groups). This file stays the feature's stable import
// path — new intra-feature code should import from ./schema/* directly.
export type { FieldType, FieldSpec, SectionSpec } from "./schema/types";
export {
  AXIS_SCALE,
  CHALLENGE_SCALE,
  CHECKLIST_VALUES,
  CONSENT_FIELD,
  MATRIX3COL_COLS,
  OPERATIONAL_CHALLENGE_ITEMS,
  PILOT_GOVERNORATE_OPTIONS,
  PRIORITY_RANKING_ITEMS,
  PRIORITY_SCALE,
  REFRIGERANT_COLS,
  SEASONAL_COLS,
  SUPPLY_DIFFICULTY_OPTIONS,
  TRAINING_SCALE,
  WORKFORCE_COLS,
} from "./schema/constants";
export {
  checklistItemLabelKey,
  fieldLabelKey,
  matrixColLabelKey,
  matrixRowLabelKey,
  optionLabelKey,
  statementLabelKey,
} from "./schema/label-keys";
export { CONSENT_SECTION } from "./schema/sections-intake";
export { SECTIONS, WIZARD_STEPS, sectionByStep } from "./schema/sections";
