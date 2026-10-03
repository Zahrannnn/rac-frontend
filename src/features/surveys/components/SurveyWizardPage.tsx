"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useAuth, can } from "@/features/auth";
import { useWorkshop } from "@/features/workshops/hooks/use-workshops";
import { useT, type TranslationKey } from "@/shared/i18n";
import {
  isOutsideEgypt,
  WORLD_LATITUDE_MAX,
  WORLD_LATITUDE_MIN,
  WORLD_LONGITUDE_MAX,
  WORLD_LONGITUDE_MIN,
} from "@/shared/validation/constants";
import { routes } from "@/shared/constants/routes";
import { ClosingEvidence } from "./ClosingEvidence";
import { InterviewShell } from "./InterviewShell";
import { QuestionStage } from "./QuestionStage";
import { ReviewStep } from "./ReviewStep";
import { SectionStage } from "./SectionStage";
import { ValidationPanel } from "./ValidationPanel";
import {
  useRecordGps,
  useSaveSection,
  useStartSurvey,
  useSubmitSurvey,
  useSurvey,
} from "../hooks/use-survey";
import { WIZARD_STEPS, type SectionSpec } from "../schema";
import {
  backTarget,
  firstInvalidWalkableIndex,
  isSectionMode,
  walkableFields,
} from "../utils/interview-nav";
import {
  buildSectionPayload,
  consentAnswer,
  firstIncompleteStep,
  isFieldValid,
  isSectionComplete,
  parseStoredSections,
  type SectionAnswers,
} from "../utils/answers";
import type { SurveyStatus, ValidationEntry } from "../types";

const REVIEW_STEP = WIZARD_STEPS.length; // index 13 — after the 13 questionnaire steps

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

  // ---- wizard state ----
  const [answers, setAnswers] = useState<Record<string, SectionAnswers>>({});
  const [step, setStep] = useState(0);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<{
    status: SurveyStatus;
    validation: ValidationEntry[];
  } | null>(null);

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
    setFieldIndex(0);
    setStep(
      stepHint === "review" || survey.status !== "Draft"
        ? REVIEW_STEP
        : Math.max(0, firstIncompleteStep(parsed))
    );
  }

  const saveSection = useSaveSection(survey?.id ?? "", workshopId);
  const recordGps = useRecordGps(survey?.id ?? "", workshopId);
  const submit = useSubmitSurvey(survey?.id ?? "", workshopId);
  const geolocation = useGeolocationCapture();
  const canStart = Boolean(user && can(user.permissions, "surveys:create"));

  const consent = consentAnswer(answers);
  const currentSection = step < WIZARD_STEPS.length ? WIZARD_STEPS[step] : null;
  const walkables = currentSection && !isSectionMode(currentSection)
    ? walkableFields(currentSection)
    : [];
  const currentField = walkables[fieldIndex] ?? null;
  const onLastClosingField =
    currentSection?.key === "closing" &&
    walkables.length > 0 &&
    fieldIndex === walkables.length - 1;

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

  function setAnswer(key: string, value: unknown) {
    const sectionKey = currentSection?.key;
    if (!sectionKey) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [key]: value },
    }));
  }

  function validateSection(section: SectionSpec): boolean {
    const sectionAnswers = answers[section.key] ?? {};
    const failing = section.fields
      .filter((field) => field.required && !isFieldValid(field, sectionAnswers[field.key]))
      .map((field) => field.key);
    setStepErrors(failing);
    return failing.length === 0;
  }

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

  function putSectionAndAdvance(section: SectionSpec) {
    let sectionAnswers = answers[section.key] ?? {};
    if (section.key === "basicInfo") {
      sectionAnswers = withWorkshopContext(sectionAnswers, workshopContext);
    }
    const payload = buildSectionPayload(section, sectionAnswers);
    saveSection.mutate(
      { key: section.key, data: payload },
      {
        onSuccess: () => {
          toast.success(t("survey.sectionSaved"));
          if (section.key === "basicInfo") {
            setAnswers((prev) => ({ ...prev, basicInfo: sectionAnswers }));
          }
          setFieldIndex(0);
          setStep((s) => Math.min(s + 1, REVIEW_STEP));
        },
        onError: (error) => handleStepError(error, "survey.terminalConflict"),
      }
    );
  }

  function goNext() {
    if (step === REVIEW_STEP) return;
    const section = WIZARD_STEPS[step];
    if (!section) return;

    if (isSectionMode(section)) {
      advanceSectionMode(section);
      return;
    }
    advanceWalkMode(section);
  }

  /** Section-mode Next: validate the whole section, then PUT and advance. */
  function advanceSectionMode(section: SectionSpec) {
    if (!validateSection(section)) {
      toast.warning(t("survey.stepIncomplete"));
      return;
    }
    putSectionAndAdvance(section);
  }

  /** Field-walk Next: gate the current question, then advance within or out of the section. */
  function advanceWalkMode(section: SectionSpec) {
    const fields = walkableFields(section);
    const field = fields[fieldIndex];
    if (!field) return;

    // photo: no client isFieldValid gate (existing); still allow advance
    if (
      field.type !== "photo" &&
      field.required &&
      !isFieldValid(field, answers[section.key]?.[field.key])
    ) {
      setStepErrors([field.key]);
      toast.warning(t("survey.stepIncomplete"));
      return;
    }
    setStepErrors([]);

    if (fieldIndex < fields.length - 1) {
      setFieldIndex((i) => i + 1);
      return;
    }
    putSectionAndAdvance(section);
  }

  function goBack() {
    setStepErrors([]);
    const target = backTarget(step, fieldIndex);
    if (target) {
      setStep(target.step);
      setFieldIndex(target.fieldIndex);
    }
  }

  function handleSubmit() {
    if (!survey) {
      return;
    }
    submit.mutate(undefined as never, {
      onSuccess: (result) => {
        setSubmitResult({ status: result.status, validation: result.validation });
        if (result.status === "Complete") {
          toast.success(t("survey.completeBanner"));
          setTimeout(() => router.push(`${routes.workshops}/${workshopId}`), 1600);
        } else {
          toast.warning(t("survey.incompleteToast"));
        }
      },
      onError: (error) => handleStepError(error, "survey.alreadySubmitted"),
    });
  }

  function jumpToStep(target: number) {
    setSubmitResult(null);
    setStepErrors([]);
    setStep(target);
    const section = WIZARD_STEPS[target];
    if (!section) {
      setFieldIndex(0);
      return;
    }
    setFieldIndex(
      firstInvalidWalkableIndex(section, answers[section.key] ?? {}, isFieldValid)
    );
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

  const sectionMode = currentSection ? isSectionMode(currentSection) : false;
  const progressLabel =
    step === REVIEW_STEP
      ? t("survey.stepReview")
      : sectionMode
        ? t("survey.stepOf", { current: step + 1, total: WIZARD_STEPS.length })
        : t("survey.interview.questionOf", {
            current: fieldIndex + 1,
            total: Math.max(1, walkables.length),
          });

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

  const footerStart =
    step < REVIEW_STEP ? (
      <Button
        type="button"
        variant="outline"
        disabled={(step === 0 && fieldIndex === 0) || saveSection.isPending}
        onClick={goBack}
      >
        {t("wizard.back")}
      </Button>
    ) : (
      <Button type="button" variant="outline" disabled={saveSection.isPending} onClick={goBack}>
        {t("wizard.back")}
      </Button>
    );

  const footerEnd =
    step === REVIEW_STEP ? (
      <Button
        type="button"
        disabled={submit.isPending || saveSection.isPending}
        onClick={handleSubmit}
      >
        {submit.isPending ? t("survey.submitting") : t("survey.submit")}
      </Button>
    ) : currentSection?.key === "consent" && consent === "no" ? null : (
      <Button
        type="button"
        onClick={goNext}
        disabled={saveSection.isPending || (currentSection?.key === "consent" && consent === null)}
      >
        {t("wizard.next")}
      </Button>
    );

  return (
    <InterviewShell
      workshopCode={survey.workshopCode}
      status={survey.status}
      title={shellTitle}
      progressLabel={progressLabel}
      progressPercent={progressPercent}
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
          <ValidationPanel validation={incompleteValidation} onJumpToStep={jumpToStep} />
        </div>
      ) : null}

      {/* ---- consent decline shortcut ---- */}
      {currentSection?.key === "consent" && consent === "no" ? (
        <div className="mb-4 rounded-lg border bg-muted p-4 text-sm">
          <p className="font-medium">{t("survey.consentDeclinedTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("survey.consentDeclinedBody")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setFieldIndex(0);
              setStep(REVIEW_STEP);
            }}
          >
            {t("survey.goToReview")}
          </Button>
        </div>
      ) : null}

      {/* ---- field-walk stage ---- */}
      {currentSection && !sectionMode && currentField ? (
        <div className="flex flex-col gap-6">
          <QuestionStage
            section={currentSection}
            field={currentField}
            answers={answers[currentSection.key] ?? {}}
            onChange={setAnswer}
            error={
              stepErrors.includes(currentField.key) ? t("survey.fieldRequired") : undefined
            }
            surveyId={survey.id}
          />

          {/* Closing GPS + docs photos on the last walkable field (before leave PUT) */}
          {onLastClosingField ? (
            <ClosingEvidence
              survey={survey}
              onSaveGps={saveGps}
              onCaptureGps={captureGps}
              isCapturing={recordGps.isPending}
            />
          ) : null}
        </div>
      ) : null}

      {/* ---- section-mode stage ---- */}
      {currentSection && sectionMode ? (
        <SectionStage
          section={currentSection}
          answers={answers[currentSection.key] ?? {}}
          onChange={setAnswer}
          stepErrors={stepErrors}
          howToFill={howToFill}
        />
      ) : null}

      {/* ---- review ---- */}
      {step === REVIEW_STEP ? (
        <ReviewStep
          answers={answers}
          gpsRecorded={gpsRecorded}
          consent={consent}
          onJumpToStep={jumpToStep}
        />
      ) : null}
    </InterviewShell>
  );
}
