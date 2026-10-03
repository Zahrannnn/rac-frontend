"use client";

import { cn } from "@/shared/utils/cn";
import { useT } from "@/shared/i18n";
import { LIFECYCLE_ORDER, type WorkshopStatus } from "../types";

/**
 * Horizontal lifecycle stepper: Draft → Submitted → Complete/Incomplete → Scored.
 * Reached states tint in, unreached ones stay grey (no per-state timestamps in
 * the contract — created/updated shown separately as the audit hint).
 */
export function StatusTimeline({ status }: { status: WorkshopStatus }) {
  const t = useT();
  const currentIndex = LIFECYCLE_ORDER.indexOf(status);

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={t("profile.timeline")}>
      {LIFECYCLE_ORDER.map((step, index) => {
        // Incomplete is a sibling of Complete, not a later stage — visually mark
        // it as reached from Submitted but flagged amber (see badge styles).
        const reached =
          step === "Incomplete"
            ? currentIndex >= LIFECYCLE_ORDER.indexOf("Submitted")
            : index <= currentIndex;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                reached
                  ? step === "Incomplete"
                    ? "bg-[var(--warning)]/15 text-[#8a5a14]"
                    : step === "Scored"
                      ? "bg-primary/15 text-primary"
                      : step === "Complete"
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-muted text-muted-foreground/60",
                index === currentIndex && "ring-2 ring-[var(--secondary)] ring-offset-1"
              )}
            >
              {t(`status.${step}` as const)}
            </span>
            {index < LIFECYCLE_ORDER.length - 1 ? (
              <span
                aria-hidden
                className={cn("h-px w-6", reached && index < currentIndex ? "bg-primary" : "bg-border")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
