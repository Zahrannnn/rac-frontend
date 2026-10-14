"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/shared/constants/routes";
import { useT } from "@/shared/i18n";

export function BackToTrainings() {
  const t = useT();
  return (
    <Link
      href={routes.trainings}
      className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {t("trainings.title")}
    </Link>
  );
}

export function TrainingLoadError({
  onRetry,
  retrying = false,
}: {
  onRetry: () => void;
  retrying?: boolean;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-6">
      <BackToTrainings />
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-5 sm:p-6">
        <p className="font-semibold text-[var(--navy)]">{t("trainings.loadFailedTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("common.error")}</p>
        <Button type="button" variant="outline" size="sm" disabled={retrying} onClick={onRetry}>
          {t("common.retry")}
        </Button>
      </div>
    </div>
  );
}

export function TrainingDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
