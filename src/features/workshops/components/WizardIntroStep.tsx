"use client";

import { Check, MapPin } from "lucide-react";
import { useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";

/** Step 1 — identification intro: code preview, creator, preparation checklist. */
export function WizardIntroStep() {
  const t = useT();
  const { user } = useAuth();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-dashed border-primary/30 bg-[color-mix(in_oklab,var(--brand-blue)_8%,white)] p-4">
        <p className="text-xs font-semibold uppercase text-primary">{t("workshops.colCode")}</p>
        <p className="mt-2 text-sm text-[var(--navy)]">{t("wizard.codePreview")}</p>
      </div>
      <div className="rounded-md border bg-muted/40 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {t("wizard.createdBy")}
        </p>
        <p className="mt-2 text-sm font-medium">{user?.fullName ?? "—"}</p>
      </div>
      <ul className="sm:col-span-2 space-y-2 rounded-md border bg-card p-4 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          {t("wizard.introNeedBasic")}
        </li>
        <li className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary)]" aria-hidden />
          {t("wizard.introNeedLocation")}
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          {t("wizard.introNeedReview")}
        </li>
      </ul>
      <p className="text-sm text-muted-foreground sm:col-span-2">{t("wizard.requiredHint")}</p>
    </div>
  );
}
