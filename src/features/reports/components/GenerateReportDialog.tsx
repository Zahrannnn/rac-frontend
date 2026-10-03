"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveBlob } from "@/shared/api/file-transfer";
import type { ApiError } from "@/shared/api/http-client";
import { useT } from "@/shared/i18n";
import { useGenerateReport } from "../hooks/use-reports";
import { useReportMeta } from "../utils/report-meta";
import {
  REPORT_SUPPORTED_FILTERS,
  type ReportDefinition,
  type ReportFilters,
} from "../types";
import { ReportFilterFields } from "./ReportFilterFields";

function GenerateReportForm({
  definition,
  onClose,
}: {
  definition: ReportDefinition;
  onClose: () => void;
}) {
  const t = useT();
  const meta = useReportMeta(definition);
  const ReportIcon = meta.icon;
  const generate = useGenerateReport();
  const [filters, setFilters] = useState<ReportFilters>({});

  const supported = useMemo(
    () => REPORT_SUPPORTED_FILTERS[definition.key] ?? [],
    [definition.key]
  );

  // Fields rendered as selects (FilterSelectField) whose clear-option value is
  // the "all" sentinel; text inputs pass raw strings and must not be remapped.
  const SELECT_FILTER_KEYS: readonly (keyof ReportFilters)[] = [
    "governorate",
    "status",
    "type",
  ];

  // "all" (select sentinel) and "" (cleared input / date bound) mean "no filter".
  const patchFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        value === "" || (value === "all" && SELECT_FILTER_KEYS.includes(key))
          ? undefined
          : value,
    }));
  };

  const run = () => {
    const cleaned: ReportFilters = {};
    for (const key of supported) {
      const value = filters[key as keyof ReportFilters];
      if (value) cleaned[key as keyof ReportFilters] = value;
    }

    generate.mutate(
      { key: definition.key, filters: cleaned },
      {
        onSuccess: ({ blob, fileName }) => {
          saveBlob(blob, fileName);
          toast.success(t("reports.generated"));
          onClose();
        },
        onError: (error) => {
          const status = (error as ApiError).status;
          const message = (error as ApiError).message;
          if (status === 400 && message) {
            toast.error(message);
          } else {
            toast.error(t("reports.generateFailed"));
          }
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--navy-shell)]/10 text-[var(--navy)]">
          <ReportIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-[var(--navy)]">{meta.title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            {meta.description}
          </DialogDescription>
        </div>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        {supported.length > 0 ? (
          <ReportFilterFields
            supported={supported}
            filters={filters}
            onFilterChange={patchFilter}
          />
        ) : (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t("reports.noFilters")}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("profile.cancel")}
          </Button>
          <Button type="submit" disabled={generate.isPending}>
            <Download data-icon="inline-start" />
            {generate.isPending ? t("reports.generating") : t("reports.download")}
          </Button>
        </div>
      </form>
    </>
  );
}

/**
 * Generate a report (XLSX-only) with optional per-definition filters and
 * download it. Form remounts per definition key so filters reset without an effect.
 */
export function GenerateReportDialog({
  definition,
  onOpenChange,
}: {
  definition: ReportDefinition | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(definition)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,48rem)] p-6 sm:p-7">
        {definition ? (
          <GenerateReportForm
            key={definition.key}
            definition={definition}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
