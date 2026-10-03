"use client";

import { FilePlus2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import type { ReportDefinition } from "../types";
import { useReportMeta } from "../utils/report-meta";

/** Picker shown by the header's primary action when no report is chosen yet. */
export function ReportPickerDialog({
  open,
  catalog,
  isPending,
  onClose,
  onPick,
}: {
  open: boolean;
  catalog: ReportDefinition[];
  isPending: boolean;
  onClose: () => void;
  onPick: (definition: ReportDefinition) => void;
}) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[min(96vw,32rem)] p-6">
        <DialogTitle className="text-[var(--navy)]">{t("reports.generateTitle")}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {t("reports.generatePickerLabel")}
        </DialogDescription>

        {isPending ? (
          <div className="flex flex-col gap-2" aria-busy>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : catalog.length === 0 ? (
          <p className="rounded-md bg-muted px-3 py-4 text-sm text-muted-foreground">
            {t("reports.catalogEmpty")}
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto pe-1">
            {catalog.map((definition) => (
              <PickerRow key={definition.id} definition={definition} onPick={onPick} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickerRow({
  definition,
  onPick,
}: {
  definition: ReportDefinition;
  onPick: (definition: ReportDefinition) => void;
}) {
  const { icon: Icon, title } = useReportMeta(definition);

  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(definition)}
        className="flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2.5 text-start transition-colors hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--navy-shell)]/10 text-[var(--navy)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--navy)]">
          {title}
        </span>
        <FilePlus2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </button>
    </li>
  );
}
