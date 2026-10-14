import type { SectionSpec } from "./types";

// Closing evidence: on-site observation checklist, photos consent, wet-signature
// captures, and the surveyor's closing date.
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
      { key: "surveyorSignature", type: "signature", required: true },
      { key: "ownerSignature", type: "signature", required: false },
      { key: "date", type: "date", required: true },
    ],
  },
];
