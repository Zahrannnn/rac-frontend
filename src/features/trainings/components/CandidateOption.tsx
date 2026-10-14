"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { CandidateRowStatus } from "../hooks/use-candidate-add";
import type { TechnicianCandidate } from "../types";
import { candidateNames } from "../utils/candidate-search";

/** One listbox row of the participant picker: names, workshop, mobile, and the add state. */
export function CandidateOption({
  id,
  candidate,
  enrolled,
  status,
  isActive,
  onActivate,
  onPick,
}: {
  id: string;
  candidate: TechnicianCandidate;
  enrolled: boolean;
  status: CandidateRowStatus | undefined;
  isActive: boolean;
  onActivate: () => void;
  onPick: () => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { primary: name, secondary: secondaryName } = candidateNames(candidate, locale);
  const adding = status?.state === "adding";

  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      aria-disabled={enrolled || adding || undefined}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={() => !isActive && onActivate()}
      onClick={onPick}
      className={cn(
        "flex min-h-14 items-center gap-3 border-b px-3 py-2.5 last:border-b-0",
        enrolled ? "cursor-default" : "cursor-pointer",
        isActive && "bg-[var(--accent)]"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "font-semibold",
              enrolled ? "text-muted-foreground" : "text-[var(--navy)]"
            )}
          >
            {name}
          </span>
          {secondaryName ? (
            <span className="text-xs text-muted-foreground" dir="auto">
              {secondaryName}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <bdi dir="ltr" className="font-mono font-semibold text-foreground/75">
            {candidate.workshopCode}
          </bdi>
          <span className="min-w-0 truncate">
            {candidate.workshopName}
            {candidate.governorate ? ` · ${governorateLabel(candidate.governorate, locale)}` : ""}
          </span>
          {candidate.mobile ? (
            <bdi dir="ltr" className="tabular-nums sm:ms-auto">
              {candidate.mobile}
            </bdi>
          ) : null}
        </p>
        {status?.state === "failed" ? (
          <p className="mt-1 text-xs text-destructive">{status.message}</p>
        ) : null}
      </div>

      <span className="shrink-0 text-xs font-medium">
        {enrolled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <Check className="size-3.5" aria-hidden />
            {t("trainings.enrolled")}
          </span>
        ) : adding ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
            {t("trainings.adding")}
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-primary"
            )}
          >
            <Plus className="size-3.5" aria-hidden />
            {status?.state === "failed" ? t("common.retry") : t("trainings.add")}
          </span>
        )}
      </span>
    </li>
  );
}
