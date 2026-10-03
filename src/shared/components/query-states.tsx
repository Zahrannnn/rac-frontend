"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";

/**
 * Async-list query scaffolding shared across features. Callers add their own
 * panel chrome via `className` so the components stay free of card styling.
 */

/** aria-busy skeleton rows standing in for a loading table or list. */
export function SkeletonRows({ count, className }: { count: number; className: string }) {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={className} />
      ))}
    </div>
  );
}

/** Inline error message with a retry action; `className` restores panel chrome. */
export function QueryErrorState({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  const t = useT();

  return (
    <div
      className={cn("flex flex-wrap items-center gap-3 text-sm text-muted-foreground", className)}
    >
      <p>{t("common.error")}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
