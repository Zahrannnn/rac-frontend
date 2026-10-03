"use client";

import { Check } from "lucide-react";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { WIZARD_STEP_KEYS } from "../constants/wizard-steps";

/** Stepper header + progress bar — purely presentational, mirrors in RTL. */
export function WizardStepper({
  step,
  onStepChange,
}: {
  step: number;
  onStepChange: (step: number) => void;
}) {
  const t = useT();
  const progressPct = Math.round(((step + 1) / WIZARD_STEP_KEYS.length) * 100);

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <ol className="flex flex-wrap items-center gap-2" aria-label={t("wizard.title")}>
        {WIZARD_STEP_KEYS.map((stepKey, index) => {
          const isCurrent = index === step;
          const isDone = index < step;
          const clickable = isDone;

          return (
            <li key={stepKey} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepChange(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                  isCurrent && "bg-[var(--secondary)] text-white",
                  isDone &&
                    "bg-primary/15 text-primary hover:bg-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  !isCurrent && !isDone && "bg-muted text-muted-foreground",
                  !clickable && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full text-[0.65rem] tabular-nums",
                    isCurrent && "bg-white/20",
                    isDone && "bg-primary text-white"
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" aria-hidden /> : index + 1}
                </span>
                <span className="hidden sm:inline">{t(stepKey)}</span>
              </button>
              {index < WIZARD_STEP_KEYS.length - 1 ? (
                <span aria-hidden className="hidden h-px w-4 bg-border sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {t("wizard.progress", { current: step + 1, total: WIZARD_STEP_KEYS.length })}
      </p>
    </div>
  );
}
