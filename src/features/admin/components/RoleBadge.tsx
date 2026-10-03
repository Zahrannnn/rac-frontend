"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { UserRole } from "../types";

const ROLE_BADGE: Record<UserRole, string> = {
  SuperAdmin: "bg-primary/15 text-primary",
  ProjectManager: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  Nou: "bg-[var(--navy-shell)]/15 text-[var(--navy)]",
  Unido: "bg-[var(--secondary)]/15 text-[var(--secondary)]",
  TrainerViewer: "bg-[var(--ai-accent)]/15 text-[var(--ai-accent)]",
  FieldTeams: "bg-muted text-foreground",
};

export function RoleBadge({ role }: { role: UserRole }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        ROLE_BADGE[role]
      )}
    >
      {t(`role.${role}` as const)}
    </span>
  );
}
