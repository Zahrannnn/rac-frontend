"use client";

import { cn } from "@/shared/utils/cn";
import { useT } from "@/shared/i18n";
import type { TechnicianStatus } from "../types";

export function TechnicianStatusBadge({ status }: { status: TechnicianStatus }) {
  const t = useT();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        status === "Active"
          ? "bg-[var(--success)]/15 text-[var(--success)]"
          : "bg-muted text-muted-foreground"
      )}
    >
      {status === "Active" ? t("technicians.statusActive") : t("technicians.statusInactive")}
    </span>
  );
}
