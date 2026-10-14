"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/i18n";
import type { SurveyStatus, ValidationEntry } from "../types";
import { ValidationPanel } from "./ValidationPanel";

/**
 * Status surfaces between the interview header and the section stage: the
 * post-submit Complete banner, the Incomplete validation panel, and the
 * consent-declined shortcut notice.
 */
export function WizardStatusBanners({
  submitStatus,
  validation,
  consentDeclined,
  onJumpToStep,
  onGoToReview,
}: {
  submitStatus: SurveyStatus | null;
  validation: ValidationEntry[] | null;
  consentDeclined: boolean;
  onJumpToStep: (step: number) => void;
  onGoToReview: () => void;
}) {
  const t = useT();

  return (
    <>
      {/* Complete banner (post-submit success) */}
      {submitStatus === "Complete" ? (
        <section
          role="status"
          className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p className="font-semibold text-[var(--success)]">{t("survey.completeBanner")}</p>
        </section>
      ) : null}

      {validation ? (
        <div className="mb-4">
          <ValidationPanel validation={validation} onJumpToStep={onJumpToStep} />
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
            onClick={onGoToReview}
          >
            {t("survey.goToReview")}
          </Button>
        </div>
      ) : null}
    </>
  );
}
