"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/shared/constants/routes";
import { useT } from "@/shared/i18n";

export function TrainingNotFound() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <GraduationCap className="size-9 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-bold text-[var(--navy)]">{t("trainings.notFoundTitle")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("trainings.notFoundMessage")}</p>
      <Button asChild variant="outline">
        <Link href={routes.trainings}>{t("trainings.title")}</Link>
      </Button>
    </div>
  );
}
