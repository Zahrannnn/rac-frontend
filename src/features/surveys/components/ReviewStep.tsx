"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { WIZARD_STEPS } from "../schema";
import { isSectionComplete, type SectionAnswers } from "../utils/answers";

/**
 * Review step: every questionnaire section in walk order with its
 * done / needs-work state, deep-linking back into the step; captured signature
 * images render as thumbnails below the list, alongside the GPS evidence row
 * and the no-consent submission warning.
 */

/** Closing signature keys whose captured images render as review thumbnails. */
const SIGNATURE_FIELDS = [
  { key: "surveyorSignature", labelKey: "survey.field.closing.surveyorSignature" },
  { key: "ownerSignature", labelKey: "survey.field.closing.ownerSignature" },
] as const;

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
  const closing = answers.closing ?? {};
  const signatureImages = SIGNATURE_FIELDS.flatMap(({ key, labelKey }) => {
    const value = closing[key];
    return typeof value === "string" && value.length > 0
      ? [{ key, label: t(labelKey as never), value }]
      : [];
  });

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

      {signatureImages.length > 0 ? (
        <div className="flex flex-wrap gap-4 rounded-lg border p-4">
          {signatureImages.map((entry) => (
            <figure key={entry.key} className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- inline
                  data-URL preview that next/image loaders cannot optimize */}
              <img
                src={entry.value}
                alt={entry.label}
                className="h-14 w-36 rounded-md border bg-white object-contain"
              />
              <figcaption className="text-xs text-muted-foreground">{entry.label}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {consent === "no" ? (
        <p className="rounded-md bg-[var(--warning)]/10 p-3 text-sm text-[#8a5a14]">
          {t("survey.submitNoConsent")}
        </p>
      ) : null}
    </div>
  );
}
