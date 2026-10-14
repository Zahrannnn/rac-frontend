"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { WIZARD_STEPS } from "../schema/sections";
import type { SectionAnswers } from "../utils/answers";
import { writeLastSectionKey } from "../utils/resume";
import { createTelemetryTracker, type TelemetryTracker } from "../utils/telemetry";

/**
 * Client-only field telemetry: one tracker per survey, section_open on visit
 * (with resume persistence in localStorage), revisits, and leave events
 * (see utils/telemetry.ts).
 */
export function useSurveyTelemetry({
  surveyId,
  answersRef,
  step,
}: {
  surveyId: string | null;
  answersRef: RefObject<Record<string, SectionAnswers>>;
  step: number;
}) {
  const trackerRef = useRef<TelemetryTracker | null>(null);

  // Telemetry tracker per survey (created before the section-enter effect below).
  useEffect(() => {
    if (!surveyId) {
      return;
    }
    trackerRef.current = createTelemetryTracker(
      surveyId,
      () => WIZARD_STEPS,
      (sectionKey) => answersRef.current[sectionKey] ?? {}
    );
    // answersRef is a stable ref created once by the wizard controller.
  }, [surveyId, answersRef]);

  // Section visits: resume persistence + section_open telemetry.
  useEffect(() => {
    if (!surveyId || step >= WIZARD_STEPS.length) {
      return;
    }
    writeLastSectionKey(surveyId, WIZARD_STEPS[step].key);
    trackerRef.current?.enterSection(WIZARD_STEPS[step].key);
  }, [surveyId, step]);

  return {
    fieldRevisited: (key: string) => trackerRef.current?.fieldRevisited(key),
    leaveSection: (toKey: string | null, viaToc: boolean) =>
      trackerRef.current?.leaveSection(toKey, viaToc),
  };
}
