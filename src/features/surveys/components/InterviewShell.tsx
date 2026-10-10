"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, Circle, Menu, X } from "lucide-react";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { SurveyStatus } from "../types";
import { SurveyStatusBadge } from "./SurveyStatusBadge";

export type TocSectionState = "complete" | "partial" | "empty";

export type TocSection = {
  key: string;
  label: string;
  state: TocSectionState;
  /** Answered count over countable (non-photo) fields — shown for partial sections. */
  answered: number;
  total: number;
  current: boolean;
};

export type InterviewShellProps = {
  workshopCode: string;
  status: SurveyStatus;
  title: string;
  progressLabel: string;
  progressPercent: number;
  /** The 13 questionnaire sections with their completion state — the drawer TOC. */
  sections: readonly TocSection[];
  onNavigateToSection: (index: number) => void;
  /** Fired when the TOC drawer opens/closes (the wizard flushes pending saves on open). */
  onTocOpenChange?: (open: boolean) => void;
  /** Subtle save-state indicator rendered at the inline end of the header row. */
  saveIndicator?: React.ReactNode;
  footerStart?: React.ReactNode;
  footerEnd?: React.ReactNode;
  children: React.ReactNode;
};

/** Non-color state mark per TOC entry: green check / "~" / empty circle. */
function StateMark({ state }: { state: TocSectionState }) {
  if (state === "complete") {
    return <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-[var(--success)]" />;
  }
  if (state === "partial") {
    return (
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full border border-muted-foreground/50 text-xs font-semibold text-muted-foreground"
      >
        ~
      </span>
    );
  }
  return <Circle aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground/50" />;
}

export function InterviewShell({
  workshopCode,
  status,
  title,
  progressLabel,
  progressPercent,
  sections,
  onNavigateToSection,
  onTocOpenChange,
  saveIndicator,
  footerStart,
  footerEnd,
  children,
}: InterviewShellProps) {
  const t = useT();
  const [tocOpen, setTocOpen] = useState(false);
  const percent = Math.min(100, Math.max(0, progressPercent));

  function handleTocOpenChange(open: boolean) {
    setTocOpen(open);
    onTocOpenChange?.(open);
  }

  function navigateFromToc(index: number) {
    setTocOpen(false);
    onTocOpenChange?.(false);
    onNavigateToSection(index);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={cn(
          "sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur",
          "md:-mx-6 md:px-6"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--navy-shell)] px-2.5 py-1 font-mono text-xs font-semibold text-white">
            {workshopCode}
          </span>
          <SurveyStatusBadge status={status} />
          <div className="ms-auto flex items-center gap-1.5">
            {saveIndicator}
            <DialogPrimitive.Root open={tocOpen} onOpenChange={handleTocOpenChange}>
              <DialogPrimitive.Trigger
                className="grid size-11 place-items-center rounded-md text-[var(--navy)] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label={t("survey.toc.open")}
              >
                <Menu className="h-5 w-5" />
              </DialogPrimitive.Trigger>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
                <DialogPrimitive.Content
                  aria-describedby={undefined}
                  className="fixed inset-y-0 start-0 z-50 flex w-80 max-w-[85vw] flex-col border-e bg-popover text-popover-foreground shadow-lg focus-visible:outline-2"
                >
                  <DialogPrimitive.Title className="border-b p-4 text-base font-semibold text-[var(--navy)]">
                    {t("survey.toc.title")}
                  </DialogPrimitive.Title>
                  <ul className="min-h-0 flex-1 overflow-y-auto py-1">
                    {sections.map((entry, index) => {
                      const statusLabel =
                        entry.state === "complete"
                          ? t("survey.toc.complete")
                          : entry.state === "partial"
                            ? t("survey.toc.count", { answered: entry.answered, total: entry.total })
                            : t("survey.toc.empty");
                      return (
                        <li key={entry.key}>
                          <button
                            type="button"
                            onClick={() => navigateFromToc(index)}
                            aria-current={entry.current ? "true" : undefined}
                            aria-label={`${entry.label} — ${statusLabel}`}
                            className={cn(
                              "flex min-h-12 w-full items-center gap-3 px-4 py-2 text-start text-sm",
                              entry.current
                                ? "bg-primary/10 font-semibold text-[var(--accent-foreground)]"
                                : "hover:bg-muted"
                            )}
                          >
                            <StateMark state={entry.state} />
                            <span className="min-w-0 flex-1">{entry.label}</span>
                            {entry.state === "partial" ? (
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {entry.answered}/{entry.total}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <DialogPrimitive.Close className="absolute end-3 top-3 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-2">
                    <X className="h-4 w-4" />
                    <span className="sr-only">{t("survey.toc.close")}</span>
                  </DialogPrimitive.Close>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
          </div>
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-[var(--navy)]">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{progressLabel}</p>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("survey.progressLabel", { percent })}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>

      {footerStart || footerEnd ? (
        <footer
          className={cn(
            "sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3",
            "border-t bg-background/95 px-4 py-3 backdrop-blur",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "md:-mx-6 md:px-6"
          )}
        >
          <div className="flex shrink-0 items-center gap-2">{footerStart}</div>
          <div className="ms-auto flex shrink-0 items-center gap-2">{footerEnd}</div>
        </footer>
      ) : null}
    </div>
  );
}
