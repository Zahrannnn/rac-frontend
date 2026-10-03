"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useT } from "@/shared/i18n";
import { useAuth } from "@/features/auth";
import { canAny } from "@/features/auth/utils/permissions";
import { useAuditLogs, usePermissionMatrix, useUsers } from "../hooks/use-admin";
import { visibleSurfaces, type AdminSurfaceDef } from "../utils/admin-surfaces";
import { matrixColumns } from "../utils/matrix";
import { AdminHubHero } from "./AdminHubHero";

/** Live count chip for a card — reads the cache the hero populated; gated so a
 * card never triggers a request for data its permission can't fetch. */
function SurfaceCount({
  surface,
  permissions,
}: {
  surface: AdminSurfaceDef;
  permissions: readonly string[];
}) {
  const t = useT();
  const enabled = canAny(permissions, surface.anyOf);
  const users = useUsers({ page: 1 }, { enabled: enabled && surface.key === "users" });
  const matrix = usePermissionMatrix({ enabled: enabled && surface.key === "permissions" });
  const audit = useAuditLogs({ page: 1 }, { enabled: enabled && surface.key === "audit" });

  let count: string | null = null;
  switch (surface.key) {
    case "users":
      count = users.data
        ? t("admin.users.totalCount", { count: users.data.totalCount })
        : null;
      break;
    case "permissions":
      count = matrix.data
        ? t("admin.matrix.size", {
            roles: matrix.data.length,
            perms: matrixColumns(matrix.data).length,
          })
        : null;
      break;
    case "audit":
      count = audit.data ? t("admin.audit.totalCount", { count: audit.data.totalCount }) : null;
      break;
  }

  if (count) {
    return (
      <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {count}
      </span>
    );
  }

  return <span className="h-[26px] w-16 shrink-0 animate-pulse rounded-md bg-muted" aria-hidden />;
}

/** One navigation card of the hub grid — whole card clickable, arrow nudges on hover. */
function SurfaceCard({
  surface,
  permissions,
}: {
  surface: AdminSurfaceDef;
  permissions: readonly string[];
}) {
  const t = useT();
  const Icon = surface.icon;

  return (
    <Link
      href={surface.href}
      className="group flex flex-col gap-4 rounded-lg border bg-card p-5 transition-colors duration-150 hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--navy-shell)]/10 text-[var(--navy)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <SurfaceCount surface={surface} permissions={permissions} />
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--navy)]">
          {t(surface.labelKey)}
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[var(--secondary)] transition-transform duration-150 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {t(surface.descKey)}
        </span>
      </span>
    </Link>
  );
}

/**
 * /admin — the console index. Navy hero band with the live headline figures,
 * then one card per surface the caller may enter; each card routes to the
 * surface's own page.
 */
export function AdminHubPage() {
  const t = useT();
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const surfaces = visibleSurfaces(permissions);

  return (
    <div className="flex flex-col gap-6">
      <AdminHubHero />

      {surfaces.length > 0 ? (
        <nav aria-label={t("admin.title")} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {surfaces.map((surface) => (
            <SurfaceCard key={surface.key} surface={surface} permissions={permissions} />
          ))}
        </nav>
      ) : (
        <div className="rounded-lg border bg-card px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">{t("error.forbiddenMessage")}</p>
        </div>
      )}
    </div>
  );
}
