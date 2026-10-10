"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useAuth, can } from "@/features/auth";
import { useWorkshop } from "@/features/workshops";
import { useT, type TranslationKey } from "@/shared/i18n";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import {
  isOutsideEgypt,
  WORLD_LATITUDE_MAX,
  WORLD_LATITUDE_MIN,
  WORLD_LONGITUDE_MAX,
  WORLD_LONGITUDE_MIN,
} from "@/shared/validation/constants";
import { routes } from "@/shared/constants/routes";
import { ClosingEvidence } from "./ClosingEvidence";
import { InterviewShell, type TocSection, type TocSectionState } from "./InterviewShell";
import { ReviewStep } from "./ReviewStep";
import { SectionStage } from "./SectionStage";
import { SaveIndicator, type WizardSaveState } from "./SaveIndicator";
import { ValidationPanel } from "./ValidationPanel";
import {
  useRecordGps,
  useSaveSection,
  useStartSurvey,
  useSubmitSurvey,
  useSurvey,
} from "../hooks/use-survey";
import { WIZARD_STEPS } from "../schema";
import {
  buildSectionPayload,
  consentAnswer,
  isFieldAnswered,
  isSectionComplete,
  parseStoredSections,
  type SectionAnswers,
} from "../utils/answers";
import { clearLastSectionKey, readLastSectionKey, writeLastSectionKey } from "../utils/resume";
import { createTelemetryTracker, type TelemetryTracker } from "../utils/telemetry";
import type { SurveyRecord, SurveyStatus, ValidationEntry } from "../types";

const REVIEW_STEP = WIZARD_STEPS.length; // index 13 — after the 13 questionnaire steps
/** Debounce window for section autosave (~1.5s after the last answer change). */
const AUTOSAVE_DELAY_MS = 1500;

/** Seed paper basicInfo fields already known from the workshop record. */
function withWorkshopContext(
  basicInfo: SectionAnswers | undefined,
  workshop: {
    code?: string;
    name?: string;
    ownerName?: string;
  } | null | undefined
): SectionAnswers {
  const next = { ...(basicInfo ?? {}) };
  if (workshop?.code && !(typeof next.projectCode === "string" && next.projectCode)) {
    next.projectCode = workshop.code;
  }
  if (workshop?.name && !(typeof next.workshopName === "string" && next.workshopName)) {
    next.workshopName = workshop.name;
  }
  if (workshop?.ownerName && !(typeof next.ownerOrManagerName === "string" && next.ownerOrManagerName)) {
    next.ownerOrManagerName = workshop.ownerName;
  }
  return next;
}

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

export function SurveyWizardPage({
  workshopId,
  stepHint,
}: {
  workshopId: string;
  /** Deep-link hint from the attention strip: "review" opens on the review step. */
  stepHint?: string;
}) {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const { data: survey, isPending, isError } = useSurvey(workshopId);
  const { data: workshop } = useWorkshop(workshopId);
  const startSurvey = useStartSurvey(workshopId);
  const workshopContext = workshop
    ? {
        code: survey?.workshopCode || workshop.code,
        name: workshop.nameAr?.trim() || workshop.nameEn?.trim() || undefined,
        ownerName: workshop.ownerName?.trim() || undefined,
      }
    : survey
      ? { code: survey.workshopCode, name: undefined, ownerName: undefined }
      : null;

  // ---- wizard state (answersRef mirrors answers for event-driven saves) ----
  const answersRef = useRef<Record<string, SectionAnswers>>({});
  const [answers, setAnswers] = useState<Record<string, SectionAnswers>>({});
  const [step, setStep] = useState(0);
  const [touchedBySection, setTouchedBySection] = useState<Record<string, string[]>>({});
  const [submitResult, setSubmitResult] = useState<{
    status: SurveyStatus;
    validation: ValidationEntry[];
  } | null>(null);

  // ---- autosave state ----
  const [saveState, setSaveState] = useState<WizardSaveState>("idle");
  const dirtySectionRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const performSaveRef = useRef<() => Promise<boolean>>(async () => true);

  // ---- field telemetry (client-only; see utils/telemetry.ts) ----
  const trackerRef = useRef<TelemetryTracker | null>(null);
  const surveyId = survey?.id ?? null;

  // Hydration key includes workshop fields so late-arriving workshop detail can seed answers.
  const hydrateKey = survey
    ? `${survey.id}:${workshopContext?.name ?? ""}:${workshopContext?.ownerName ?? ""}:${workshopContext?.code ?? ""}`
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

  const saveSection = useSaveSection(survey?.id ?? "", workshopId);
  const recordGps = useRecordGps(survey?.id ?? "", workshopId);
  const submit = useSubmitSurvey(survey?.id ?? "", workshopId);
  const geolocation = useGeolocationCapture();
  const canStart = Boolean(user && can(user.permissions, "surveys:create"));

  const consent = consentAnswer(answers);
  const currentSection = step < WIZARD_STEPS.length ? WIZARD_STEPS[step] : null;

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
  }, [surveyId]);

  // Section visits: resume persistence + section_open telemetry.
  useEffect(() => {
    if (!surveyId || step >= WIZARD_STEPS.length) {
      return;
    }
    writeLastSectionKey(surveyId, WIZARD_STEPS[step].key);
    trackerRef.current?.enterSection(WIZARD_STEPS[step].key);
  }, [surveyId, step]);

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

  // GPS: capture + editable map confirmation, saved to the survey record immediately.
  // Backend contract mirrored: world-impossible coordinates are rejected (400);
  // outside-Egypt coordinates save but warn — non-blocking field evidence (audit 1.3).
  function saveGps(latitude: number, longitude: number) {
    if (
      latitude < WORLD_LATITUDE_MIN ||
      latitude > WORLD_LATITUDE_MAX ||
      longitude < WORLD_LONGITUDE_MIN ||
      longitude > WORLD_LONGITUDE_MAX
    ) {
      toast.error(t("wizard.gpsInvalid"));
      return;
    }
    if (isOutsideEgypt(latitude, longitude)) {
      toast.warning(t("wizard.gpsOutOfRange"));
    }
    recordGps.mutate(
      { latitude, longitude },
      {
        onSuccess: () => toast.success(t("wizard.gpsCaptured")),
        onError: () => toast.error(`${t("common.error")} — ${t("common.retry")}`),
      }
    );
  }

  function captureGps() {
    geolocation.capture({
      onPosition: saveGps,
    });
  }

  function setAnswer(sectionKey: string, key: string, value: unknown) {
    const previous = answersRef.current[sectionKey]?.[key];
    if (isFieldAnswered(previous) && previous !== value) {
      trackerRef.current?.fieldRevisited(key);
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
    markDirty(sectionKey);
  }

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

  function clearSaveTimer() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }

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
    clearSaveTimer();
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

  // 409 = survey went terminal elsewhere (redirect out); 403 already toasts upstream.
  function handleStepError(error: unknown, conflictToastKey: TranslationKey) {
    const status = (error as { status?: number }).status;
    if (status === 409) {
      toast.warning(t(conflictToastKey));
      router.push(`${routes.workshops}/${workshopId}`);
    } else if (status !== 403) {
      toast.error(`${t("common.error")} — ${t("common.retry")}`);
    }
  }

  /** Free navigation — answers live in local state, nothing is discarded. */
  function goToSection(target: number, viaToc = false) {
    const clamped = Math.max(0, Math.min(target, REVIEW_STEP));
    const fromKey = step < WIZARD_STEPS.length ? WIZARD_STEPS[step].key : null;
    const toKey = clamped < WIZARD_STEPS.length ? WIZARD_STEPS[clamped].key : null;
    setSubmitResult(null);
    setStep(clamped);
    if (fromKey && fromKey !== toKey) {
      trackerRef.current?.leaveSection(toKey, viaToc);
    }
    // leaving a section (or the wizard via review) flushes its pending answers
    void performSaveRef.current();
  }

  function goNext() {
    if (step >= REVIEW_STEP) return;
    goToSection(step + 1);
  }

  function goBack() {
    if (step === 0) return;
    goToSection(step - 1);
  }

  async function handleSubmit() {
    if (!survey) {
      return;
    }
    const saved = await performSaveRef.current();
    if (!saved) {
      return; // save failed — error indicator is visible, answers kept for retry
    }
    submit.mutate(undefined as never, {
      onSuccess: (result) => {
        setSubmitResult({ status: result.status, validation: result.validation });
        if (result.status === "Complete") {
          clearLastSectionKey(survey.id);
          toast.success(t("survey.completeBanner"));
          setTimeout(() => router.push(`${routes.workshops}/${workshopId}`), 1600);
        } else {
          toast.warning(t("survey.incompleteToast"));
        }
      },
      onError: (error) => handleStepError(error, "survey.alreadySubmitted"),
    });
  }

  function retrySave() {
    void performSaveRef.current();
  }

  function handleTocOpenChange(open: boolean) {
    if (open) {
      void performSaveRef.current();
    }
  }

  // ---- loading / not-started / error states ----
  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-xl font-bold">{t("survey.notFound")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("profile.notFoundMessage")}</p>
        <Button asChild variant="outline">
          <Link href={`${routes.workshops}/${workshopId}` as Route}>{t("profile.backToList")}</Link>
        </Button>
      </main>
    );
  }

  if (!survey) {
    // No survey yet — start gate for surveys:create holders, quiet note otherwise.
    return (
      <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-xl font-bold">{t("survey.none")}</h1>
        {canStart ? (
          <Button onClick={() => startSurvey.mutate()} disabled={startSurvey.isPending}>
            {startSurvey.isPending ? t("common.loading") : t("survey.start")}
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={`${routes.workshops}/${workshopId}` as Route}>{t("profile.backToList")}</Link>
          </Button>
        )}
      </main>
    );
  }

  const gpsRecorded =
    survey.latitude !== null && survey.longitude !== null && survey.gpsRecordedAtUtc !== null;

  const incompleteValidation =
    submitResult && submitResult.status !== "Complete"
      ? submitResult.validation
      : survey.status === "Incomplete" && survey.validation?.length
        ? survey.validation
        : null;

  const doneCount = WIZARD_STEPS.filter((section) =>
    isSectionComplete(section, answers[section.key] ?? {})
  ).length;
  const progressPercent = Math.round((doneCount / WIZARD_STEPS.length) * 100);

  const tocSections: TocSection[] = WIZARD_STEPS.map((section, index) => {
    const sectionAnswers = answers[section.key] ?? {};
    const countable = section.fields.filter((field) => field.type !== "photo");
    const answered = countable.filter((field) => isFieldAnswered(sectionAnswers[field.key])).length;
    const complete = isSectionComplete(section, sectionAnswers);
    const state: TocSectionState = complete ? "complete" : answered === 0 ? "empty" : "partial";
    return {
      key: section.key,
      label: t(`survey.section.${section.key}` as never),
      state,
      answered,
      total: countable.length,
      current: index === step,
    };
  });

  const progressLabel =
    step === REVIEW_STEP
      ? t("survey.stepReview")
      : t("survey.stepOf", { current: step + 1, total: WIZARD_STEPS.length });

  const shellTitle =
    step === REVIEW_STEP
      ? t("survey.reviewTitle")
      : currentSection
        ? t(`survey.section.${currentSection.key}` as never)
        : t("survey.wizardTitle");

  const howToFill =
    currentSection?.fields.some((field) => field.type === "checklist")
      ? t("survey.interview.howToFillChecklist")
      : t("survey.interview.howToFill");

  const consentDeclined = currentSection?.key === "consent" && consent === "no";

  const footerStart =
    step > 0 ? (
      <Button type="button" variant="outline" onClick={goBack}>
        {t("wizard.back")}
      </Button>
    ) : null;

  const footerEnd =
    step === REVIEW_STEP ? (
      <Button
        type="button"
        disabled={submit.isPending || saveState === "saving"}
        onClick={handleSubmit}
      >
        {submit.isPending ? t("survey.submitting") : t("survey.submit")}
      </Button>
    ) : consentDeclined ? null : (
      <Button
        type="button"
        onClick={goNext}
        disabled={currentSection?.key === "consent" && consent === null}
      >
        {t("wizard.next")}
      </Button>
    );

  // Breadcrumb: Workshops → {workshop} → survey. The middle crumb appears once
  // the workshop (or at least its code) is known; loading/error states skip it.
  const profileHref = `${routes.workshops}/${workshopId}` as Route;
  const workshopCrumbLabel = workshopContext?.name ?? workshopContext?.code ?? null;
  const crumbs = [
    { label: t("workshops.title"), href: routes.workshops },
    ...(workshopCrumbLabel
      ? [{ label: workshopCrumbLabel, href: profileHref }]
      : []),
    { label: t("workshops.surveyBreadcrumb") },
  ];

  return (
    <>
      <PageBreadcrumbs items={crumbs} />
      <InterviewShell
        workshopCode={survey.workshopCode}
        status={survey.status}
        title={shellTitle}
        progressLabel={progressLabel}
        progressPercent={progressPercent}
        sections={tocSections}
        onNavigateToSection={(index) => goToSection(index, true)}
        onTocOpenChange={handleTocOpenChange}
        saveIndicator={<SaveIndicator state={saveState} onRetry={retrySave} />}
        footerStart={footerStart}
        footerEnd={footerEnd}
      >
      {/* Complete banner (post-submit success) */}
      {submitResult?.status === "Complete" ? (
        <section
          role="status"
          className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p className="font-semibold text-[var(--success)]">{t("survey.completeBanner")}</p>
        </section>
      ) : null}

      {incompleteValidation ? (
        <div className="mb-4">
          <ValidationPanel validation={incompleteValidation} onJumpToStep={goToSection} />
        </div>
      ) : null}

      {/* ---- consent decline shortcut ---- */}
      {consentDeclined ? (
        <div className="mb-4 rounded-lg border bg-muted p-4 text-sm">
          <p className="font-medium">{t("survey.consentDeclinedTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("survey.consentDeclinedBody")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => goToSection(REVIEW_STEP)}
          >
            {t("survey.goToReview")}
          </Button>
        </div>
      ) : null}

      {/* ---- section page: all fields on one scrollable page ---- */}
      {currentSection ? (
        <SectionStage
          key={currentSection.key}
          section={currentSection}
          answers={answers[currentSection.key] ?? {}}
          onChange={(key, value) => setAnswer(currentSection.key, key, value)}
          touchedFields={touchedBySection[currentSection.key] ?? []}
          howToFill={howToFill}
          surveyId={survey.id}
        >
          {currentSection.key === "closing" ? (
            <div className="mt-2 flex flex-col gap-4 rounded-lg border bg-card p-4">
              <ClosingEvidence
                survey={survey}
                onSaveGps={saveGps}
                onCaptureGps={captureGps}
                isCapturing={recordGps.isPending}
              />
            </div>
          ) : null}
        </SectionStage>
      ) : null}

      {/* ---- review ---- */}
      {step === REVIEW_STEP ? (
        <ReviewStep answers={answers} gpsRecorded={gpsRecorded} consent={consent} onJumpToStep={goToSection} />
      ) : null}
      </InterviewShell>
    </>
  );
}
