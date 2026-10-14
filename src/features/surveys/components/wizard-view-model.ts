import { useT } from "@/shared/i18n";
import { WIZARD_STEPS } from "../schema/sections";
import { isFieldAnswered, isSectionComplete, type SectionAnswers } from "../utils/answers";
import type { FieldSpec, SectionSpec } from "../schema/types";
import type { TocSection, TocSectionState } from "./InterviewShell";

/** View-model for the interview shell: table of contents, progress label,
 * heading, and per-section fill instructions. Pure builders over the wizard
 * state — unit-testable without rendering. */

/** Per-section answered counts (photos excluded) and completion state, current highlighted. */
export function buildTocSections({
  answers,
  step,
  t,
}: {
  answers: Record<string, SectionAnswers>;
  step: number;
  t: ReturnType<typeof useT>;
}): TocSection[] {
  return WIZARD_STEPS.map((section, index) => {
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
}

/** "Review" past the last section, otherwise "step n of m". */
export function buildProgressLabel({
  step,
  t,
}: {
  step: number;
  t: ReturnType<typeof useT>;
}): string {
  return step === WIZARD_STEPS.length
    ? t("survey.stepReview")
    : t("survey.stepOf", { current: step + 1, total: WIZARD_STEPS.length });
}

/** Heading: review title, current section title, or the wizard fallback. */
export function buildShellTitle({
  currentSection,
  step,
  t,
}: {
  currentSection: SectionSpec | null;
  step: number;
  t: ReturnType<typeof useT>;
}): string {
  return step === WIZARD_STEPS.length
    ? t("survey.reviewTitle")
    : currentSection
      ? t(`survey.section.${currentSection.key}` as never)
      : t("survey.wizardTitle");
}

/** Checklist sections explain the three-state marking; everything else the standard how-to. */
export function buildHowToFill({
  currentSection,
  t,
}: {
  currentSection: SectionSpec | null;
  t: ReturnType<typeof useT>;
}): string {
  return currentSection?.fields.some((field: FieldSpec) => field.type === "checklist")
    ? t("survey.interview.howToFillChecklist")
    : t("survey.interview.howToFill");
}
