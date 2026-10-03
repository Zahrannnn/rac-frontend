"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { SurveyStatus } from "../types";
import { SurveyStatusBadge } from "./SurveyStatusBadge";

export type InterviewShellProps = {
  workshopCode: string;
  status: SurveyStatus;
  title: string;
  progressLabel: string;
  progressPercent: number;
  footerStart?: React.ReactNode;
  footerEnd?: React.ReactNode;
  children: React.ReactNode;
};

export function InterviewShell({
  workshopCode,
  status,
  title,
  progressLabel,
  progressPercent,
  footerStart,
  footerEnd,
  children,
}: InterviewShellProps) {
  const t = useT();
  const percent = Math.min(100, Math.max(0, progressPercent));

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
