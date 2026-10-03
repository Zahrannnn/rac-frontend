"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useT, type TranslationKey } from "@/shared/i18n";

/**
 * Console band for an admin sub-surface: navy shell, breadcrumb back to the
 * hub, the surface title, a mono count chip, and a trailing actions slot.
 */
export function AdminSurfaceHeader({
  labelKey,
  count,
  children,
}: {
  labelKey: TranslationKey;
  count?: string;
  children?: ReactNode;
}) {
  const t = useT();

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-[var(--navy-shell)] px-4 py-3 text-white">
      <div className="min-w-0">
        <nav aria-label={t("admin.title")} className="flex items-center gap-1.5 text-[0.7rem] text-white/70">
          <Link href="/admin" className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:text-white hover:underline">
            {t("admin.title")}
          </Link>
          <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
          <span aria-current="page">{t(labelKey)}</span>
        </nav>
        <h1 className="mt-0.5 truncate text-lg font-bold">{t(labelKey)}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {count ? (
          <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-semibold tabular-nums">
            {count}
          </span>
        ) : null}
        {children}
      </div>
    </header>
  );
}
