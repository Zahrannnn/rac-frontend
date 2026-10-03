"use client";

import { cn } from "@/shared/utils/cn";
import { useT } from "@/shared/i18n";
import type { SurveyStatus } from "../types";

const STYLES: Record<SurveyStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-[var(--info)]/15 text-[var(--info)]",
  Complete: "bg-[var(--success)]/15 text-[var(--success)]",
  Incomplete: "bg-[var(--warning)]/15 text-[#8a5a14]",
};

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const t = useT();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status]
      )}
    >
      {t(`status.${status}` as const)}
    </span>
  );
}
