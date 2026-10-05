"use client";

import type { ReactNode } from "react";
import { useT, type TranslationKey } from "@/shared/i18n";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";

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
        <PageBreadcrumbs
          tone="inverted"
          className="text-[0.7rem]"
          items={[{ label: t("admin.title"), href: "/admin" }, { label: t(labelKey) }]}
        />
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
