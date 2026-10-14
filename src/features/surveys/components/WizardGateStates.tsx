"use client";

import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";

/** Hydration skeleton shown while the survey record loads. */
export function WizardLoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Survey fetch failed — offer the way back to the workshop profile. */
export function WizardErrorState({ workshopId }: { workshopId: string }) {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-xl font-bold">{t("survey.notFound")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("profile.notFoundMessage")}</p>
      <Button asChild variant="outline">
        <Link href={`${routes.workshops}/${workshopId}` as Route}>{t("profile.backToList")}</Link>
      </Button>
    </main>
  );
}

/**
 * No survey yet — start gate for surveys:create holders, quiet note otherwise.
 */
export function WizardStartGate({
  workshopId,
  canStart,
  onStart,
  isStarting,
}: {
  workshopId: string;
  canStart: boolean;
  onStart: () => void;
  isStarting: boolean;
}) {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-xl font-bold">{t("survey.none")}</h1>
      {canStart ? (
        <Button onClick={onStart} disabled={isStarting}>
          {isStarting ? t("common.loading") : t("survey.start")}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={`${routes.workshops}/${workshopId}` as Route}>{t("profile.backToList")}</Link>
        </Button>
      )}
    </main>
  );
}
