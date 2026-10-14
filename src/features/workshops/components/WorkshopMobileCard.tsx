"use client";

import { ChevronRight } from "lucide-react";
import { useT } from "@/shared/i18n";
import { StatusBadge, TypeBadge } from "./badges";
import { formatDateUtc, governorateLabel, workshopDisplayName } from "../utils/format";
import type { Workshop } from "../types";

/** Compact registry card shown by the shared DataTable on narrow viewports. */
export function WorkshopMobileCard({
  workshop,
  locale,
  onOpen,
}: {
  workshop: Workshop;
  locale: string;
  onOpen: () => void;
}) {
  const t = useT();
  const title = workshopDisplayName(workshop);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-primary">{workshop.code}</p>
          <p className="mt-1 truncate font-semibold text-[var(--navy)]">{title}</p>
          {workshop.nameAr ? (
            <p className="truncate text-xs text-muted-foreground">{workshop.nameEn}</p>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--secondary)] rtl:rotate-180" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={workshop.status} />
        <TypeBadge type={workshop.type} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{governorateLabel(workshop.governorate, locale)}</span>
        <span className="tabular-nums">{formatDateUtc(workshop.createdAtUtc)}</span>
      </div>
      <span className="sr-only">{t("workshops.openWorkshop")}</span>
    </button>
  );
}
