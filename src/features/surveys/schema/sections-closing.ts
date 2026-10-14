import type { SectionSpec } from "./types";

// Closing evidence: on-site observation checklist, photos consent, and the
// surveyor's closing date. Signatures were removed from the questionnaire
// (customer decision 2026-10-14); legacy stored answers may still carry the
// old surveyorSignature/ownerSignature keys — answers parsing ignores them.
export const CLOSING_SECTIONS: readonly SectionSpec[] = [
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
      { key: "date", type: "date", required: true },
    ],
  },
];
