import type { SectionSpec } from "../schema";
import { isFieldValid } from "./answers";

/**
 * Field survey UX telemetry — client-side only, never sent to the backend.
 * Append-only ring buffer (last 200 events) in localStorage, keyed per survey,
 * so field UX assumptions (free navigation, resume, revisits) can be validated
 * from real usage later.
 */
const MAX_EVENTS = 200;

function storageKey(surveyId: string): string {
  return `rac.telemetry.survey.${surveyId}`;
}

export type TelemetryEvent =
  | { type: "section_open"; sectionKey: string; at: number }
  | { type: "section_dwell_ms"; sectionKey: string; dwellMs: number; at: number }
  | { type: "toc_jump"; from: string; to: string; at: number }
  | { type: "field_revisited"; fieldKey: string; at: number }
  | { type: "abandon_section"; sectionKey: string; unansweredRequired: number; at: number };

/** Read the persisted event buffer for one survey (oldest first). */
export function readTelemetry(surveyId: string): TelemetryEvent[] {
  try {
    const raw = window.localStorage.getItem(storageKey(surveyId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as TelemetryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Append one event, trim to the last MAX_EVENTS, and debug-log in dev. */
export function logTelemetryEvent(surveyId: string, event: TelemetryEvent): void {
  const next = [...readTelemetry(surveyId), event].slice(-MAX_EVENTS);
  try {
    window.localStorage.setItem(storageKey(surveyId), JSON.stringify(next));
  } catch {
    // storage full/disabled — telemetry is best-effort, never breaks the wizard
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug("[survey-telemetry]", event);
  }
}

export type TelemetryTracker = {
  /** Called when the wizard renders a section page. */
  enterSection: (sectionKey: string) => void;
  /** Called when navigating away — logs dwell + abandon on unanswered requireds. */
  leaveSection: (nextSectionKey: string | null, viaToc: boolean) => void;
  /** Called when an already-answered field is edited. */
  fieldRevisited: (fieldKey: string) => void;
};

/** Creates the per-survey tracker wired into the wizard. */
export function createTelemetryTracker(
  surveyId: string,
  getSections: () => readonly SectionSpec[],
  getSectionAnswers: (sectionKey: string) => Record<string, unknown>,
  now: () => number = () => Date.now()
): TelemetryTracker {
  let currentKey: string | null = null;
  let enteredAt = 0;

  return {
    enterSection(sectionKey) {
      currentKey = sectionKey;
      enteredAt = now();
      logTelemetryEvent(surveyId, { type: "section_open", sectionKey, at: enteredAt });
    },

    leaveSection(nextSectionKey, viaToc) {
      if (!currentKey) {
        return;
      }
      const left = now();
      logTelemetryEvent(surveyId, {
        type: "section_dwell_ms",
        sectionKey: currentKey,
        dwellMs: Math.max(0, left - enteredAt),
        at: left,
      });

      if (viaToc && nextSectionKey) {
        logTelemetryEvent(surveyId, {
          type: "toc_jump",
          from: currentKey,
          to: nextSectionKey,
          at: left,
        });
      }

      const section = getSections().find((candidate) => candidate.key === currentKey);
      if (section) {
        const answers = getSectionAnswers(currentKey);
        const unansweredRequired = section.fields.filter(
          (field) => field.required && !isFieldValid(field, answers[field.key])
        ).length;
        if (unansweredRequired > 0) {
          logTelemetryEvent(surveyId, {
            type: "abandon_section",
            sectionKey: currentKey,
            unansweredRequired,
            at: left,
          });
        }
      }
      currentKey = null;
    },

    fieldRevisited(fieldKey) {
      // collapse keystroke runs: one revisit event per contiguous editing burst
      const events = readTelemetry(surveyId);
      const last = events[events.length - 1];
      if (last?.type === "field_revisited" && last.fieldKey === fieldKey) {
        return;
      }
      logTelemetryEvent(surveyId, { type: "field_revisited", fieldKey, at: now() });
    },
  };
}
