"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/i18n";
import { WIZARD_STEPS } from "../schema";
import type { ValidationEntry } from "../types";

/**
 * Amber Incomplete panel: failing rules from submit (or stored ValidationJson),
 * each deep-linking to its questionnaire step (SYSTEM-DESIGN §6).
 */
export function ValidationPanel({
  validation,
  onJumpToStep,
}: {
  validation: ValidationEntry[];
  onJumpToStep: (step: number) => void;
}) {
  const t = useT();
  const failures = validation.filter((entry) => !entry.passed);

  if (failures.length === 0) {
    return null;
  }

  return (
    <section
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#8a5a14]" />
          <h2 className="font-semibold text-[#8a5a14]">{t("survey.incompleteTitle")}</h2>
        </div>
        <p className="text-xs font-medium text-[#8a5a14]">{t("survey.incompleteHint")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {failures.map((entry, index) => {
          const step = WIZARD_STEPS.findIndex((section) => section.key === entry.sectionKey);
          const ruleLabel = t(`survey.rule.${entry.ruleKey}` as never);
          return (
            <li
              key={`${entry.ruleKey}-${entry.sectionKey}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--navy)]">{ruleLabel}</p>
                <p className="text-xs text-muted-foreground">{entry.detail}</p>
              </div>
              {step >= 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onJumpToStep(step)}
                >
                  {t("survey.fixInSection", {
                    name: t(`survey.section.${entry.sectionKey}` as never),
                  })}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
