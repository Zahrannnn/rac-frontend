"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/shared/constants/routes";
import { useT } from "@/shared/i18n";
import { canAny } from "../utils/permissions";
import { useAuth } from "../hooks/use-auth-session";

/**
 * Deep-link guard: renders children only when the session grants one of the
 * required permission keys; otherwise the 403 state (Arabic-first, per RBAC-AUDIT).
 */
export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: readonly string[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  const t = useT();

  if (!user || canAny(user.permissions, anyOf)) {
    return <>{children}</>;
  }

  return (
    <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">{t("error.forbiddenTitle")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("error.forbiddenMessage")}</p>
      <Button asChild variant="outline">
        <Link href={routes.dashboard}>{t("common.backToDashboard")}</Link>
      </Button>
    </main>
  );
}
