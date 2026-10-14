"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkshop } from "@/features/workshops";
import { WIZARD_STEPS } from "../schema/sections";
import {
  consentAnswer,
  isFieldAnswered,
  parseStoredSections,
  type SectionAnswers,
} from "../utils/answers";
import { readLastSectionKey } from "../utils/resume";
import { withWorkshopContext, type WorkshopSurveyContext } from "../utils/workshop-prefill";
import type { SurveyRecord } from "../types";
import { useSectionAutosave } from "./use-section-autosave";
import { useSurvey } from "./use-survey";
import { useSurveyGps } from "./use-survey-gps";
import { useSurveySubmit } from "./use-survey-submit";
import { useSurveyTelemetry } from "./use-survey-telemetry";

const REVIEW_STEP = WIZARD_STEPS.length; // index 13 — after the 13 questionnaire steps

/**
 * Landing step on hydration. Terminal statuses are view-only (review);
 * Draft/Incomplete resume onto the last-visited section (localStorage),
 * falling back to consent on a first open.
 */
function initialStep(survey: SurveyRecord, stepHint?: string): number {
  if (stepHint === "review" || survey.status === "Submitted" || survey.status === "Complete") {
    return REVIEW_STEP;
  }
  const stored = readLastSectionKey(survey.id);
  if (stored) {
    const index = WIZARD_STEPS.findIndex((section) => section.key === stored);
    if (index >= 0) {
      return index;
    }
  }
  return 0; // first open lands on consent
}

/**
 * Stateful wizard controller: composes hydration, autosave, telemetry, GPS
 * evidence, submission, and free navigation over the questionnaire sections.
 * Presentation (shell, gates, derived view-model) stays in SurveyWizardPage.
 */
export function useSurveyWizard({
  workshopId,
  stepHint,
}: {
  workshopId: string;
  /** Deep-link hint from the attention strip: "review" opens on the review step. */
  stepHint?: string;
}) {
  const { data: survey, isPending, isError } = useSurvey(workshopId);

  const { data: workshop } = useWorkshop(workshopId);
  const workshopContext: WorkshopSurveyContext | null = workshop
    ? {
        code: survey?.workshopCode || workshop.code,
        name: workshop.nameAr?.trim() || workshop.nameEn?.trim() || undefined,
        ownerName: workshop.ownerName?.trim() || undefined,
        governorate: workshop.governorate,
        district: workshop.district ?? undefined,
        address: workshop.address,
        mobile: workshop.mobile,
      }
    : survey
      ? { code: survey.workshopCode }
      : null;

  // ---- wizard state (answersRef mirrors answers for event-driven saves) ----
  const answersRef = useRef<Record<string, SectionAnswers>>({});
  const [answers, setAnswers] = useState<Record<string, SectionAnswers>>({});
  const [step, setStep] = useState(0);
  const [touchedBySection, setTouchedBySection] = useState<Record<string, string[]>>({});

  // Hydration key includes workshop fields so late-arriving workshop detail can seed answers.
  const hydrateKey = survey
    ? `${survey.id}:${JSON.stringify(workshopContext ?? {})}`
    : null;
  const [hydratedFromKey, setHydratedFromKey] = useState<string | null>(null);
  if (survey && hydrateKey && hydratedFromKey !== hydrateKey) {
    setHydratedFromKey(hydrateKey);
    const parsed = parseStoredSections(survey.sections);
    parsed.basicInfo = withWorkshopContext(parsed.basicInfo, workshopContext);
    setAnswers(parsed);
    setTouchedBySection({});
    setStep(initialStep(survey, stepHint));
  }

  // Mirror answers into a ref for event-driven saves (hydration path syncs here;
  // setAnswer keeps it fresh synchronously in event handlers).
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const surveyId = survey?.id ?? null;
  const autosave = useSectionAutosave({
    surveyId: surveyId ?? "",
    workshopId,
    workshopContext,
    answersRef,
    setAnswers,
  });
  const telemetry = useSurveyTelemetry({ surveyId, answersRef, step });
  const submitApi = useSurveySubmit({ survey: survey ?? undefined, workshopId, flush: autosave.flush });
  const gps = useSurveyGps(surveyId ?? "", workshopId);

  const consent = consentAnswer(answers);
  const currentSection = step < WIZARD_STEPS.length ? WIZARD_STEPS[step] : null;

  function setAnswer(sectionKey: string, key: string, value: unknown) {
    const previous = answersRef.current[sectionKey]?.[key];
    if (isFieldAnswered(previous) && previous !== value) {
      telemetry.fieldRevisited(key);
    }
    const next = {
      ...answersRef.current,
      [sectionKey]: { ...(answersRef.current[sectionKey] ?? {}), [key]: value },
    };
    answersRef.current = next;
    setAnswers(next);
    setTouchedBySection((prev) => {
      const touched = prev[sectionKey] ?? [];
      return touched.includes(key) ? prev : { ...prev, [sectionKey]: [...touched, key] };
    });
    autosave.markDirty(sectionKey);
  }

  /** Free navigation — answers live in local state, nothing is discarded. */
  function goToSection(target: number, viaToc = false) {
    const clamped = Math.max(0, Math.min(target, REVIEW_STEP));
    const fromKey = step < WIZARD_STEPS.length ? WIZARD_STEPS[step].key : null;
    const toKey = clamped < WIZARD_STEPS.length ? WIZARD_STEPS[clamped].key : null;
    submitApi.clearSubmitResult();
    setStep(clamped);
    if (fromKey && fromKey !== toKey) {
      telemetry.leaveSection(toKey, viaToc);
    }
    // leaving a section (or the wizard via review) flushes its pending answers
    void autosave.flush();
  }

  function goNext() {
    if (step >= REVIEW_STEP) return;
    goToSection(step + 1);
  }

  function goBack() {
    if (step === 0) return;
    goToSection(step - 1);
  }

  function handleTocOpenChange(open: boolean) {
    if (open) {
      void autosave.flush();
    }
  }

  return {
    survey,
    workshopContext,
    isPending,
    isError,
    answers,
    touchedBySection,
    step,
    currentSection,
    reviewStep: REVIEW_STEP,
    consent,
    saveState: autosave.saveState,
    submitResult: submitApi.submitResult,
    submit: submitApi.submit,
    setAnswer,
    goToSection,
    goNext,
    goBack,
    handleSubmit: submitApi.handleSubmit,
    handleTocOpenChange,
    retrySave: () => void autosave.flush(),
    saveGps: gps.saveGps,
    captureGps: gps.captureGps,
    isCapturingGps: gps.isCapturing,
  };
}
