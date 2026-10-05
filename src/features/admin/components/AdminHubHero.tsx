"use client";

import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { canAny, useAuth } from "@/features/auth";
import { useAuditLogs, usePermissionMatrix, useUsers } from "../hooks/use-admin";

/** One live headline figure in the navy band — skeleton while pending, omitted on error. */
function HeroFigure({
  labelKey,
  value,
  pending,
}: {
  labelKey: TranslationKey;
  value: number | undefined;
  pending: boolean;
}) {
  const t = useT();
  const { dir } = useI18n();

  if (pending) {
    return (
      <div className="min-w-[5.5rem]">
        <div className="h-8 w-12 animate-pulse rounded bg-white/20" aria-hidden />
        <div className="mt-2 h-3 w-16 rounded bg-white/10" aria-hidden />
      </div>
    );
  }

  if (value === undefined) return null;

  return (
    <div className="min-w-[5.5rem]">
      <p className="text-2xl font-bold leading-none tabular-nums">
        {value.toLocaleString("en-US")}
      </p>
      <p
        className={`mt-1.5 text-xs font-semibold text-white/70 ${
          dir === "ltr" ? "tracking-wide" : "tracking-normal"
        }`}
      >
        {t(labelKey)}
      </p>
    </div>
  );
}

/**
 * Navy band heading the /admin hub: title, subtitle, and the live headline
 * figures for the surfaces the caller may enter (users · roles · audit).
 * Each figure's query is enabled only when its permission is held, so a
 * PM-with-audit-only session never calls the users or matrix endpoints.
 */
export function AdminHubHero() {
  const t = useT();
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];

  const usersVisible = canAny(permissions, ["admin:users"]);
  const matrixVisible = canAny(permissions, ["admin:permissions"]);
  const auditVisible = canAny(permissions, ["admin:audit"]);

  const users = useUsers({ page: 1 }, { enabled: usersVisible });
  const matrix = usePermissionMatrix({ enabled: matrixVisible });
  const audit = useAuditLogs({ page: 1 }, { enabled: auditVisible });

  return (
    <section className="rounded-lg bg-[var(--navy-shell)] px-5 py-5 text-white sm:px-6 sm:py-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-white/70">
            {t("admin.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 lg:justify-end">
          {usersVisible ? (
            <HeroFigure
              labelKey="admin.hero.users"
              value={users.data?.totalCount}
              pending={users.isPending}
            />
          ) : null}
          {matrixVisible ? (
            <HeroFigure
              labelKey="admin.hero.roles"
              value={matrix.data?.length}
              pending={matrix.isPending}
            />
          ) : null}
          {auditVisible ? (
            <HeroFigure
              labelKey="admin.hero.audit"
              value={audit.data?.totalCount}
              pending={audit.isPending}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
