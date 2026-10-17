"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { useAuth, can } from "@/features/auth";
import { useT } from "@/shared/i18n";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { routes } from "@/shared/constants/routes";
import { ClosingEvidence } from "./ClosingEvidence";
import { InterviewShell } from "./InterviewShell";
import { ReviewStep } from "./ReviewStep";
import { SectionStage } from "./SectionStage";
import { SaveIndicator } from "./SaveIndicator";
import { WizardErrorState, WizardLoadingState, WizardStartGate } from "./WizardGateStates";
import { WizardStatusBanners } from "./WizardStatusBanners";
import {
  buildHowToFill,
  buildProgressLabel,
  buildShellTitle,
  buildTocSections,
} from "./wizard-view-model";
import { usePhotoMutations, useStartSurvey, useSurveyPhotos } from "../hooks/use-survey";
import { useSurveyWizard } from "../hooks/use-survey-wizard";
import { WIZARD_STEPS } from "../schema/sections";
import { isSectionComplete } from "../utils/answers";

export function SurveyWizardPage({
  workshopId,
  stepHint,
}: {
  workshopId: string;
  /** Deep-link hint from the attention strip: "review" opens on the review step. */
  stepHint?: string;
}) {
  const t = useT();
  const { user } = useAuth();
  const startSurvey = useStartSurvey(workshopId);
  const {
    survey,
    workshopContext,
    isPending,
    isError,
    answers,
    touchedBySection,
    step,
    currentSection,
    reviewStep,
    consent,
    saveState,
    submitResult,
    submit,
    setAnswer,
    goToSection,
    goNext,
    goBack,
    handleSubmit,
    handleTocOpenChange,
    retrySave,
    saveGps,
    captureGps,
    isCapturingGps,
  } = useSurveyWizard({ workshopId, stepHint });

  const canStart = Boolean(user && can(user.permissions, "surveys:create"));

  // Product decision (2026-10-14): picking "رفض صاحب الورشة" hides the workshop
  // front-photo capture (already optional) and deletes any photo uploaded before
  // the refusal, so a refused-consent survey ships with zero basicInfo photos.
  const photosRefused =
    (answers["closing"] as Record<string, unknown> | undefined)?.photosConsent === "ownerRefused";
  const photos = useSurveyPhotos(survey?.id);
  const { remove: removePhoto } = usePhotoMutations(survey?.id ?? "");
  const basicPhotos = (photos.data ?? []).filter((photo) => photo.sectionKey === "basicInfo");
  useEffect(() => {
    if (!photosRefused || basicPhotos.length === 0) {
      return;
    }
    basicPhotos.forEach((photo) => removePhoto.mutate(photo.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only on the refusal flip / photo count
  }, [photosRefused, basicPhotos.length]);

  // ---- loading / not-started / error states ----
  if (isPending) {
    return <WizardLoadingState />;
  }

  if (isError) {
    return <WizardErrorState workshopId={workshopId} />;
  }

  if (!survey) {
    return (
      <WizardStartGate
        workshopId={workshopId}
        canStart={canStart}
        onStart={() => startSurvey.mutate()}
        isStarting={startSurvey.isPending}
      />
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

  const tocSections = buildTocSections({ answers, step, t });

  const progressLabel = buildProgressLabel({ step, t });

  const shellTitle = buildShellTitle({ currentSection, step, t });

  const howToFill = buildHowToFill({ currentSection, t });

  const consentDeclined = currentSection?.key === "consent" && consent === "no";

  const footerStart =
    step > 0 ? (
      <Button type="button" variant="outline" onClick={goBack}>
        {t("wizard.back")}
      </Button>
    ) : null;

  const footerEnd =
    step === reviewStep ? (
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
      <WizardStatusBanners
        submitStatus={submitResult?.status ?? null}
        validation={incompleteValidation}
        consentDeclined={consentDeclined}
        onJumpToStep={goToSection}
        onGoToReview={() => goToSection(reviewStep)}
      />

      {/* ---- section page: all fields on one scrollable page ---- */}
      {currentSection ? (
        <SectionStage
          key={currentSection.key}
          section={
            photosRefused && currentSection.key === "basicInfo"
              ? {
                  ...currentSection,
                  fields: currentSection.fields.filter((field) => field.key !== "frontPhoto"),
                }
              : currentSection
          }
          answers={answers[currentSection.key] ?? {}}
          onChange={(key, value) => setAnswer(currentSection.key, key, value)}
          touchedFields={touchedBySection[currentSection.key] ?? []}
          howToFill={howToFill}
          surveyId={survey.id}
          intro={
            currentSection.key === "consent" ? (
              /* Questionnaire Ver3 opening paragraph + title, above the consent mark */
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-base font-semibold text-[var(--navy)]">
                  {t("survey.intro.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("survey.intro.body")}
                </p>
              </div>
            ) : undefined
          }
        >
          {currentSection.key === "closing" ? (
            <div className="mt-2 flex flex-col gap-4 rounded-lg border bg-card p-4">
              <ClosingEvidence
                survey={survey}
                photosHidden={photosRefused}
                onSaveGps={saveGps}
                onCaptureGps={captureGps}
                isCapturing={isCapturingGps}
              />
            </div>
          ) : null}
        </SectionStage>
      ) : null}

      {/* ---- review ---- */}
      {step === reviewStep ? (
        <ReviewStep answers={answers} gpsRecorded={gpsRecorded} consent={consent} onJumpToStep={goToSection} />
      ) : null}
      </InterviewShell>
    </>
  );
}
