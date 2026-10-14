import type { SectionSpec } from "./types";
import { CONSENT_FIELD, PILOT_GOVERNORATE_OPTIONS } from "./constants";

export const CONSENT_SECTION: SectionSpec = {
  key: "consent",
  order: -1,
  fields: [
    { key: CONSENT_FIELD, type: "enum", required: true, options: ["yes", "no"] },
  ],
};

export const INTAKE_SECTIONS: readonly SectionSpec[] = [
  {
    key: "basicInfo",
    order: 0,
    fields: [
      { key: "projectCode", type: "string", required: false },
      { key: "workshopName", type: "string", required: true },
      { key: "ownerOrManagerName", type: "string", required: true },
      {
        key: "governorate", type: "enum", required: true, ui: "select",
        options: PILOT_GOVERNORATE_OPTIONS,
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
      // service-center floor area (m²) — program guidance ≥ 25 m², optional per product
      // decision (2026-10-13); the helper stays as guidance and the rubric scores it
      // only when answered (missing = zero-band, never a submit blocker).
      { key: "serviceAreaM2", type: "int", required: false, min: 1, helper: true },
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
        key: "leakCauses", type: "multi", required: false, helper: true,
        options: [
          "condenserDamage", "evaporatorDamage", "hoseDamage", "oRingDamage", "badConnections",
          "badCharging", "collisionAccidents", "postRepairInstallErrors", "other",
        ],
      },
      { key: "mixedGasDetected", type: "enum", required: false, options: ["yes", "no"] },
      // paper line 157 — workshop owns a refrigerant analyzer/identifier (yes/no)
      { key: "hasGasIdentifier", type: "yesNo", required: false },
    ],
  },
];
