"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { useT } from "@/shared/i18n";
import type { WorkshopStatus, WorkshopType } from "../types";

/** Lifecycle status badge — color + Arabic/English text label (never color alone). */
export function StatusBadge({ status }: { status: WorkshopStatus }) {
  const t = useT();

  const styles: Record<WorkshopStatus, string> = {
    Draft: "bg-muted text-muted-foreground",
    Submitted: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    Complete: "bg-[var(--success)]/15 text-[var(--success)]",
    Incomplete: "bg-[var(--warning)]/15 text-[#8a5a14]",
  };

  return (
    <Badge variant="secondary" className={cn("border-transparent", styles[status])}>
      {t(`status.${status}` as const)}
    </Badge>
  );
}

/** Type badge — "غير رسمية" renders proudly in the standard tint, never warning amber. */
export function TypeBadge({ type }: { type: WorkshopType }) {
  const t = useT();

  return (
    <Badge variant="secondary" className="border-[color:var(--accent-foreground)]/30 bg-transparent text-foreground">
      {t(`type.${type}` as const)}
    </Badge>
  );
}

export function FlagBadge({ flag }: { flag: "DuplicateSuspected" | "NotRelevant" }) {
  const t = useT();

  return (
    <Badge variant="secondary" className="border-transparent bg-[var(--warning)]/15 text-[#8a5a14]">
      {t(`flag.${flag}` as const)}
    </Badge>
  );
}
