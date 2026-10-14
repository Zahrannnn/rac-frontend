import type { SectionSpec } from "./types";
import {
  AXIS_SCALE,
  CHALLENGE_SCALE,
  OPERATIONAL_CHALLENGE_ITEMS,
  PRIORITY_RANKING_ITEMS,
  PRIORITY_SCALE,
  TRAINING_SCALE,
} from "./constants";

// ---- axes 1–8 (paper §ثالثًا): one mark per row ----
export const AXIS_SECTIONS: readonly SectionSpec[] = [
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
];
