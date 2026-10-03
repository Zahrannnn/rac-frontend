"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { WIZARD_STEPS } from "../schema";
import { isSectionComplete, type SectionAnswers } from "../utils/answers";

/**
 * Review step: every questionnaire section in walk order with its
 * done / needs-work state, deep-linking back into the step; the GPS evidence
 * row and the no-consent submission warning sit below the list.
 */
export function ReviewStep({
  answers,
  gpsRecorded,
  consent,
  onJumpToStep,
}: {
  answers: Record<string, SectionAnswers>;
  gpsRecorded: boolean;
  consent: "yes" | "no" | null;
  onJumpToStep: (step: number) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y rounded-lg border">
        {WIZARD_STEPS.map((section, index) => {
          const complete = isSectionComplete(section, answers[section.key] ?? {});
          return (
            <li key={section.key}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-start text-sm hover:bg-muted"
                onClick={() => onJumpToStep(index)}
              >
                <span>{t(`survey.section.${section.key}` as never)}</span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    complete ? "text-[var(--success)]" : "text-[#8a5a14]"
                  )}
                >
                  {complete ? t("survey.sectionDone") : t("survey.sectionNeedsWork")}
                </span>
              </button>
            </li>
          );
        })}
        <li className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm">
          <span>{t("survey.gpsTitle")}</span>
          <span
            className={cn(
              "text-xs font-semibold",
              gpsRecorded ? "text-[var(--success)]" : "text-[#8a5a14]"
            )}
          >
            {gpsRecorded ? t("survey.sectionDone") : t("survey.sectionNeedsWork")}
          </span>
        </li>
      </ul>

      {consent === "no" ? (
        <p className="rounded-md bg-[var(--warning)]/10 p-3 text-sm text-[#8a5a14]">
          {t("survey.submitNoConsent")}
        </p>
      ) : null}
    </div>
  );
}
