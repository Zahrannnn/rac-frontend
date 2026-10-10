"use client";

import { AlertTriangle, Check, CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/i18n";

export type WizardSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Subtle save-state indicator for the wizard header — text + icon so the
 * state never rides on color alone, aria-live for assistive tech.
 */
export function SaveIndicator({
  state,
  onRetry,
}: {
  state: WizardSaveState;
  onRetry: () => void;
}) {
  const t = useT();

  if (state === "idle") {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground"
    >
      {state === "saving" ? (
        <>
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">{t("survey.save.saving")}</span>
        </>
      ) : null}
      {state === "saved" ? (
        <>
          <Check aria-hidden className="h-3.5 w-3.5 text-[var(--success)]" />
          <span className="hidden sm:inline">{t("survey.save.saved")}</span>
        </>
      ) : null}
      {state === "dirty" ? (
        <>
          <CloudUpload aria-hidden className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("survey.save.dirty")}</span>
        </>
      ) : null}
      {state === "error" ? (
        <>
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 text-destructive" />
          <span className="text-destructive">{t("survey.save.failed")}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-9 px-2 text-xs"
            onClick={onRetry}
          >
            {t("common.retry")}
          </Button>
        </>
      ) : null}
    </div>
  );
}
