"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { governorateLabel } from "../utils/format";
import type { DuplicateMatch } from "../types";

/**
 * Advisory “possible duplicate” panel — never blocks registration.
 * Actions: open existing / continue as new / mark as different.
 */
export function DuplicatePanel({
  matches,
  onContinueAsNew,
  onDismiss,
  busy,
}: {
  matches: DuplicateMatch[];
  onContinueAsNew: () => void;
  onDismiss: () => void;
  busy?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();

  if (matches.length === 0) {
    return null;
  }

  return (
    <section
      role="alert"
      className="flex flex-col gap-4 rounded-lg border border-[color-mix(in_oklab,var(--secondary)_40%,var(--border))] bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklab,var(--secondary)_18%,white)] text-[var(--secondary)]">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold text-[var(--navy)]">{t("duplicate.title")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("duplicate.subtitle")}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li
            key={match.workshopId}
            className="rounded-md border border-border bg-[color-mix(in_oklab,var(--brand-blue)_6%,white)] p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-xs font-semibold text-primary">{match.code}</span>
                <span className="ms-2 font-medium text-[var(--navy)]">{match.name}</span>
                <span className="ms-2 text-muted-foreground">
                  {governorateLabel(match.governorate, locale)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workshops/${match.workshopId}` as Route)}
              >
                {t("duplicate.open")}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("duplicate.reason")}:{" "}
              {match.reasons
                .map((reason) => {
                  const key = `duplicate.reason.${reason}` as TranslationKey;
                  const label = t(key);
                  return label === key ? reason : label;
                })
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={onContinueAsNew}>
          {t("duplicate.continueNew")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={onDismiss}
        >
          {t("duplicate.notSame")}
        </Button>
      </div>
    </section>
  );
}
