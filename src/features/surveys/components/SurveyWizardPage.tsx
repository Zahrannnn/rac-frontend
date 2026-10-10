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
  buildSectionPayload,
  consentAnswer,
  isFieldAnswered,
  isSectionComplete,
  parseStoredSections,
  type SectionAnswers,
} from "../utils/answers";
import type { SurveyRecord, SurveyStatus, ValidationEntry } from "../types";

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

/** Landing step on hydration — terminal statuses view-only on review. */
function initialStep(survey: SurveyRecord, stepHint?: string): number {
  if (stepHint === "review" || survey.status === "Submitted" || survey.status === "Complete") {
    return REVIEW_STEP;
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

  // ---- wizard state ----
  const [answers, setAnswers] = useState<Record<string, SectionAnswers>>({});
  const [step, setStep] = useState(0);
  const [touchedBySection, setTouchedBySection] = useState<Record<string, string[]>>({});
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
    setTouchedBySection({});
    setStep(initialStep(survey, stepHint));
  }

  const saveSection = useSaveSection(survey?.id ?? "", workshopId);
  const recordGps = useRecordGps(survey?.id ?? "", workshopId);
  const submit = useSubmitSurvey(survey?.id ?? "", workshopId);
  const geolocation = useGeolocationCapture();
  const canStart = Boolean(user && can(user.permissions, "surveys:create"));

  const consent = consentAnswer(answers);
  const currentSection = step < WIZARD_STEPS.length ? WIZARD_STEPS[step] : null;

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
    setAnswers((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [key]: value },
    }));
    setTouchedBySection((prev) => {
      const touched = prev[sectionKey] ?? [];
      return touched.includes(key) ? prev : { ...prev, [sectionKey]: [...touched, key] };
    });
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

  /** PUT the section's DataJson (save-on-continue until autosave lands). */
  function putSection(section: SectionSpec) {
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
        },
        onError: (error) => handleStepError(error, "survey.terminalConflict"),
      }
    );
  }

  /** Free navigation — answers live in local state, nothing is discarded. */
  function goToSection(target: number) {
    const clamped = Math.max(0, Math.min(target, REVIEW_STEP));
    setSubmitResult(null);
    setStep(clamped);
  }

  /** Continue = flush the section (legacy save-on-exit), then move forward. */
  function goNext() {
    if (step >= REVIEW_STEP) return;
    const section = WIZARD_STEPS[step];
    if (!section) return;
    putSection(section);
    goToSection(step + 1);
  }

  function goBack() {
    if (step === 0) return;
    goToSection(step - 1);
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
      <Button type="button" disabled={submit.isPending} onClick={handleSubmit}>
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
        onNavigateToSection={goToSection}
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
