// 1:1 transcription of docs/survey-schema-v2.json — no invented fields.
// Axis sections (order 2–9) are Likert tables transcribed from the paper
// questionnaire (one mark per row); axis 8 also carries a 12-item priority
// ranking (1–5) and 8 operational challenges (3-level).
// Labels live in i18n (survey.field.*, survey.opt.*, survey.row.*, survey.col.*,
// survey.item.*, survey.statement.*).

export type FieldType =
  | "string"
  | "text"
  | "email"
  | "phone"
  | "int"
  | "enum"
  | "multi"
  | "yesNo"
  | "matrix3x3"
  | "matrix2x5"
  | "matrixDynamic"
  | "matrix3col"
  | "likert"
  | "checklist"
  | "signature"
  | "date"
  | "photo";

export type FieldSpec = {
  key: string;
  type: FieldType;
  required: boolean;
  options?: readonly string[];
  /** likert: answer-option keys rendered as table columns (e.g. no/somewhat/yes). */
  scale?: readonly string[];
  /** likert: rows are statements labeled `survey.statement.{section}.{row}`. */
  statementRows?: boolean;
  /** likert: table first-column header key (defaults to survey.likert.statementCol). */
  firstColKey?: string;
  min?: number;
  max?: number;
  /** i18n label key suffix — full key is `survey.field.{section}.{key}`. */
  label?: boolean;
};

export type SectionSpec = {
  key: string;
  /** 0-based questionnaire order (consent is the implicit step 0 handled here too). */
  order: number;
  fields: readonly FieldSpec[];
};

export const CONSENT_FIELD = "consent.participate" as const;

// Axes 1–5, 7, 8 statements (paper columns: لا | الى حد ما | نعم).
export const AXIS_SCALE = ["no", "somewhat", "yes"] as const;
// Axis 6 (paper columns: لا احتاج | الى حد ما | احتاج).
export const TRAINING_SCALE = ["dontNeed", "somewhat", "need"] as const;
// Axis 8 priority ranking (paper: 1 = low … 5 = very high priority).
export const PRIORITY_SCALE = ["1", "2", "3", "4", "5"] as const;
// Axis 8 operational challenges (paper: لا يمثل تحدي | الى حد ما | يمثل تحدي).
export const CHALLENGE_SCALE = ["notAChallenge", "somewhat", "isChallenge"] as const;

export const PRIORITY_RANKING_ITEMS = [
  "refrigerantRecoveryUnit",
  "chargingRecoveryStation",
  "a2lLeakDetector",
  "gasAnalyzer",
  "vacuumPump",
  "electronicScale",
  "manifoldHoseSet",
  "recoveryCylinders",
  "pipingTools",
  "technicianPpe",
  "evServiceEquipment",
  "electricalTestEquipment",
] as const;

export const OPERATIONAL_CHALLENGE_ITEMS = [
  "refrigerantPrices",
  "genuineGasAvailability",
  "toolsShortage",
  "trainedTechnicianShortage",
  "safetyEquipmentCost",
  "modernCarsDifficulty",
  "evHybridDifficulty",
  "recoveredGasDisposal",
] as const;

export const CONSENT_SECTION: SectionSpec = {
  key: "consent",
  order: -1,
  fields: [
    { key: CONSENT_FIELD, type: "enum", required: true, options: ["yes", "no"] },
  ],
};

export const SECTIONS: readonly SectionSpec[] = [
  {
    key: "basicInfo",
    order: 0,
    fields: [
      { key: "projectCode", type: "string", required: false },
      { key: "workshopName", type: "string", required: true },
      { key: "ownerOrManagerName", type: "string", required: true },
      {
        key: "governorate", type: "enum", required: true,
        options: ["cairo", "giza", "qalyubia"],
      },
      { key: "district", type: "string", required: true },
      { key: "address", type: "text", required: true },
      { key: "phoneWhatsapp", type: "phone", required: true },
      { key: "email", type: "email", required: false },
      { key: "businessStartYear", type: "int", required: true, min: 1950, max: 2026 },
      {
        key: "workshopType", type: "enum", required: true,
        options: ["independent", "authorizedServiceCenter", "dealerAffiliated"],
      },
      {
        key: "gasSizeClass", type: "enum", required: true,
        options: ["small_lt680", "medium_680_1360", "large_gt1360"],
      },
      {
        key: "legalStatus", type: "enum", required: true,
        options: ["registered", "underRegistration", "unregistered", "declinesToDisclose"],
      },
      {
        key: "ownership", type: "enum", required: true,
        options: ["male", "female", "joint", "company"],
      },
      // front photo — required by the default minPhotos rule (basicInfo ≥ 1)
      { key: "frontPhoto", type: "photo", required: true },
    ],
  },
  {
    key: "workforce",
    order: 1,
    fields: [
      {
        key: "workforce", type: "matrix3x3", required: true,
        options: ["engineers", "acTechnicians", "traineesAssistants"],
      },
      {
        key: "avgTechnicianExperience", type: "enum", required: true,
        options: ["lt1y", "y1_5", "y6_10", "y11_15", "gt15"],
      },
      {
        key: "carsPerMonth", type: "matrix2x5", required: true,
        options: ["peakSeason_may_sep", "offSeason_oct_apr"],
      },
      {
        key: "vehicleTypes", type: "multi", required: true,
        options: ["private", "taxi", "microbus", "bus", "trucks", "electricHybrid", "other"],
      },
      {
        key: "refrigerants", type: "matrixDynamic", required: true,
        options: ["R-134a", "R-1234yf", "other"],
      },
      {
        key: "annualGasKg", type: "matrix3col", required: true,
        options: ["R-134a", "R-1234yf", "other"],
      },
      { key: "annualLeakageKg", type: "matrix3col", required: false, options: ["R-134a", "R-1234yf", "other"] },
      { key: "expectedRecoveryKg", type: "matrix3col", required: false, options: ["R-134a", "R-1234yf", "other"] },
      {
        key: "leakCauses", type: "multi", required: false,
        options: [
          "condenserDamage", "evaporatorDamage", "hoseDamage", "oRingDamage", "badConnections",
          "badCharging", "collisionAccidents", "postRepairInstallErrors", "other",
        ],
      },
      { key: "mixedGasDetected", type: "enum", required: false, options: ["yes", "no", "unknown"] },
      // paper line 157 — workshop owns a refrigerant analyzer/identifier (yes/no)
      { key: "hasGasIdentifier", type: "yesNo", required: false },
    ],
  },
  // ---- axes 1–8 (paper §ثالثًا): one mark per row ----
  {
    key: "orgManagement",
    order: 2,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "technicalCapability",
    order: 3,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "refrigerantEmissions",
    order: 4,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "safety",
    order: 5,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "toolsEquipment",
    order: 6,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "trainingNeeds",
    order: 7,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        firstColKey: "survey.likert.trainingCol",
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12", "s13"],
        scale: TRAINING_SCALE,
      },
    ],
  },
  {
    key: "participationReadiness",
    order: 8,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
        scale: AXIS_SCALE,
      },
    ],
  },
  {
    key: "inclusionGenderInformal",
    order: 9,
    fields: [
      {
        key: "statements", type: "likert", required: true, statementRows: true,
        options: ["s1", "s2", "s3", "s4"],
        scale: AXIS_SCALE,
      },
      {
        key: "priorityRanking", type: "likert", required: true,
        firstColKey: "survey.likert.toolCol",
        options: PRIORITY_RANKING_ITEMS,
        scale: PRIORITY_SCALE,
      },
      {
        key: "operationalChallenges", type: "likert", required: true,
        firstColKey: "survey.likert.challengeCol",
        options: OPERATIONAL_CHALLENGE_ITEMS,
        scale: CHALLENGE_SCALE,
      },
    ],
  },
  {
    key: "observationChecklist",
    order: 10,
    fields: [
      {
        key: "items", type: "checklist", required: true,
        options: [
          "commercialRegistry", "taxCard", "safetyCertificate", "clearSignboard", "fixedLocation",
          "properVentilation", "workingFireExtinguishers", "vacuumPump", "leakDetector",
          "recoveryMachine", "electronicScale", "identifiedGasCylinders", "recoveryCylinders",
          "properEquipmentStorage",
        ],
      },
    ],
  },
  {
    key: "closing",
    order: 11,
    fields: [
      { key: "photosConsent", type: "enum", required: true, options: ["taken", "ownerRefused"] },
      { key: "surveyorSignature", type: "signature", required: true },
      { key: "ownerSignature", type: "signature", required: false },
      { key: "date", type: "date", required: true },
    ],
  },
];

/** The 13 wizard steps in order: consent first, then schema order. */
export const WIZARD_STEPS: readonly SectionSpec[] = [CONSENT_SECTION, ...SECTIONS];

export const WORKFORCE_COLS = ["male", "female", "total"] as const;
export const SEASONAL_COLS = ["lt20", "20_49", "50_99", "100_200", "gt200"] as const;
export const MATRIX3COL_COLS = ["lt860", "680_1360", "gt1360"] as const;
export const REFRIGERANT_COLS = ["used", "supplyDifficulty", "carsPerMonthApprox"] as const;
export const SUPPLY_DIFFICULTY_OPTIONS = ["available", "difficult", "unavailable"] as const;
export const CHECKLIST_VALUES = ["available", "unavailable", "notVerified"] as const;

export function sectionByStep(stepIndex: number): SectionSpec {
  return WIZARD_STEPS[stepIndex];
}

export function fieldLabelKey(sectionKey: string, fieldKey: string): string {
  return `survey.field.${sectionKey}.${fieldKey}`;
}

export function optionLabelKey(key: string): string {
  return `survey.opt.${key}`;
}

export function checklistItemLabelKey(key: string): string {
  return `survey.item.${key}`;
}

/** Axis statement rows are namespaced per section (survey.statement.{section}.{row}). */
export function statementLabelKey(sectionKey: string, rowKey: string): string {
  return `survey.statement.${sectionKey}.${rowKey}`;
}

export function matrixRowLabelKey(key: string): string {
  return `survey.row.${key}`;
}

export function matrixColLabelKey(key: string): string {
  return `survey.col.${key}`;
}
