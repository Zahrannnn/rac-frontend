"use client";

import { Clock } from "lucide-react";
import { useT, type TranslationKey } from "@/shared/i18n";

/** Week-1 stand-in for module UIs that arrive in weeks 2–4 (title + "قريبًا" state). */
export function ModulePlaceholder({ titleKey }: { titleKey: TranslationKey }) {
  const t = useT();

  return (
    <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Clock className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">{t("placeholder.moduleTitle", { name: t(titleKey) })}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("placeholder.moduleSoon")}</p>
    </main>
  );
}
