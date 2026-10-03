"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";

/** Pending state shared by the workshop detail pages (profile + edit). */
export function WorkshopDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

/** 404 = missing OR existence-hiding (unassigned FieldTeam) — same graceful state. */
export function WorkshopNotFoundState() {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-xl font-bold">{t("profile.notFound")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("profile.notFoundMessage")}</p>
      <Button asChild variant="outline">
        <Link href={routes.workshops}>{t("profile.backToList")}</Link>
      </Button>
    </main>
  );
}
