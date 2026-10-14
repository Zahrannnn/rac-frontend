"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";
import type { WizardSaveState } from "../components/SaveIndicator";
import { WIZARD_STEPS } from "../schema/sections";
import { buildSectionPayload, type SectionAnswers } from "../utils/answers";
import { withWorkshopContext, type WorkshopSurveyContext } from "../utils/workshop-prefill";
import { useSaveSection } from "./use-survey";

/** Debounce window for section autosave (~1.5s after the last answer change). */
const AUTOSAVE_DELAY_MS = 1500;

/**
 * Debounced per-section autosave engine. Tracks the dirty section, schedules a
 * save ~1.5s after the last change, flushes on navigation/tab-hide/unload, and
 * keeps failed answers dirty so nothing is silently dropped.
 */
export function useSectionAutosave({
  surveyId,
  workshopId,
  workshopContext,
  answersRef,
  setAnswers,
}: {
  surveyId: string;
  workshopId: string;
  workshopContext: WorkshopSurveyContext | null;
  answersRef: RefObject<Record<string, SectionAnswers>>;
  /** Keeps the rendered answers in sync when a save re-seeds basicInfo. */
  setAnswers: (next: Record<string, SectionAnswers>) => void;
}) {
  const router = useRouter();
  const t = useT();
  const saveSection = useSaveSection(surveyId, workshopId);
  const [saveState, setSaveState] = useState<WizardSaveState>("idle");
  const dirtySectionRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const performSaveRef = useRef<() => Promise<boolean>>(async () => true);

  // Flush pending changes when the tab is hidden or the page is being unloaded.
  useEffect(() => {
    function flushOnHide() {
      if (document.visibilityState === "hidden") {
        void performSaveRef.current();
      }
    }
    const onPageHide = () => void performSaveRef.current();
    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("pagehide", onPageHide);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // 409 = survey went terminal elsewhere (redirect out); 403 already toasts upstream.
  function handleSaveError(error: unknown) {
    const status = (error as { status?: number }).status;
    if (status === 409) {
      toast.warning(t("survey.terminalConflict"));
      router.push(`${routes.workshops}/${workshopId}`);
    } else if (status !== 403) {
      // keep the section dirty — the visible indicator offers a retry
      setSaveState("error");
      toast.error(`${t("common.error")} — ${t("common.retry")}`);
    } else {
      setSaveState("error");
    }
  }

  /**
   * PUT the dirty section (same per-section endpoint as before). Returns false
   * when the save failed — the answers stay dirty so the next change, flush or
   * explicit retry re-attempts; nothing is silently dropped.
   */
  async function performSave(): Promise<boolean> {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const sectionKey = dirtySectionRef.current;
    const section = sectionKey
      ? WIZARD_STEPS.find((candidate) => candidate.key === sectionKey)
      : undefined;
    if (!sectionKey || !section) {
      return true;
    }

    let sectionAnswers = answersRef.current[sectionKey] ?? {};
    if (sectionKey === "basicInfo") {
      sectionAnswers = withWorkshopContext(sectionAnswers, workshopContext);
    }
    const payload = buildSectionPayload(section, sectionAnswers);

    setSaveState("saving");
    try {
      await saveSection.mutateAsync({ key: sectionKey, data: payload });
      if (dirtySectionRef.current === sectionKey) {
        dirtySectionRef.current = null;
        setSaveState("saved");
      }
      if (sectionKey === "basicInfo") {
        const seeded = withWorkshopContext(answersRef.current.basicInfo, workshopContext);
        answersRef.current = { ...answersRef.current, basicInfo: seeded };
        setAnswers(answersRef.current);
      }
      return true;
    } catch (error) {
      handleSaveError(error);
      return false;
    }
  }

  // Latest performSave for timer/event callbacks (re-registered each render).
  useEffect(() => {
    performSaveRef.current = performSave;
  });

  /** Queue a debounced autosave for the section the surveyor just edited. */
  function markDirty(sectionKey: string) {
    dirtySectionRef.current = sectionKey;
    setSaveState("dirty");
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void performSaveRef.current();
    }, AUTOSAVE_DELAY_MS);
  }

  return {
    saveState,
    markDirty,
    /** Flush the dirty section now (navigation, submit, retry, TOC open). */
    flush: () => performSaveRef.current(),
  };
}
