"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { RubricKind } from "../types";

/**
 * Run-kind chip — the text label carries the meaning ("status is never color alone");
 * the tint is only a secondary cue. Participation keeps the primary tone, equipment
 * the deep-blue shell tone.
 */
export function RunKindChip({ kind, className }: { kind: RubricKind; className?: string }) {
  const t = useT();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        kind === "participation"
          ? "bg-primary/15 text-primary"
          : "bg-[var(--navy)]/10 text-[var(--navy)]",
        className
      )}
    >
      {t(kind === "participation" ? "selection.kind.participation" : "selection.kind.equipment")}
    </span>
  );
}
