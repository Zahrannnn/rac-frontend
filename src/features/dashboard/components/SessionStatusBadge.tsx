"use client";

import { Badge } from "@/components/ui/badge";
import { useT, type TranslationKey } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";

/** Session status badge — text label always (never color alone). Unknown
 * statuses fall back to the raw backend string, still labeled. */
export function SessionStatusBadge({ status }: { status: string }) {
  const t = useT();

  const labelKeys: Record<string, TranslationKey> = {
    Completed: "trainings.statusCompleted",
    Upcoming: "trainings.statusUpcoming",
  };
  const label = labelKeys[status] ? t(labelKeys[status]) : status;
  const tone =
    status === "Completed"
      ? "border-transparent bg-[var(--success)]/15 text-[var(--success)]"
      : status === "Upcoming"
        ? "border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]"
        : "border-transparent bg-muted text-muted-foreground";

  return (
    <Badge variant="secondary" className={cn(tone)}>
      {label}
    </Badge>
  );
}
