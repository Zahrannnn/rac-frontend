export const CONSENT_FIELD = "consent.participate" as const;

// Questionnaire Ver3 pilot governorates — the survey's governorate enum offers
// EXACTLY these three (the 27-governorate registry constant lives in
// @/shared/constants/egypt for the workshops registry).
export const PILOT_GOVERNORATE_OPTIONS = ["cairo", "giza", "qalyubia"] as const;

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

export const WORKFORCE_COLS = ["male", "female", "total"] as const;
/** Seasonal volume bands (questionnaire Ver3, backend-pinned):
 * <20 / 20–49 / 50–99 / 100–200 / >200 cars/month. */
export const SEASONAL_COLS = ["lt20", "20_49", "50_99", "100_200", "gt200"] as const;
export const MATRIX3COL_COLS = ["lt860", "680_1360", "gt1360"] as const;
export const REFRIGERANT_COLS = ["used", "supplyDifficulty", "carsPerMonthApprox"] as const;
/** Paper: a single صعوبة توفير الغاز mark per refrigerant — yes/no pair. */
export const SUPPLY_DIFFICULTY_OPTIONS = ["no", "yes"] as const;
export const CHECKLIST_VALUES = ["available", "unavailable", "notVerified"] as const;
