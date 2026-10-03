"use client";

import { useState } from "react";
import { FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useReportCatalog } from "../hooks/use-reports";
import type { ReportDefinition } from "../types";
import { CatalogSection } from "./CatalogSection";
import { GenerateReportDialog } from "./GenerateReportDialog";
import { ReportOverview } from "./ReportOverview";
import { ReportPickerDialog } from "./ReportPickerDialog";

/**
 * Reports analytics surface: header + generate action, catalog with filters,
 * and overview KPIs + analytics (real dashboard-summary / runs fields). The
 * run history table is currently disabled (kept below, commented out, for
 * quick re-enable). Client component (TanStack Query data surfaces).
 */
export function ReportsPage() {
  const t = useT();
  const { user } = useAuth();
  const canManage = Boolean(user && can(user.permissions, "reports:manage"));

  const { data: catalog, isPending, isError, refetch } = useReportCatalog();
  const [generating, setGenerating] = useState<ReportDefinition | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const definitions = catalog ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("reports.title")} description={t("reports.subtitle")}>
        <Button type="button" onClick={() => setPickerOpen(true)}>
          <FileBarChart data-icon="inline-start" />
          {t("reports.generate")}
        </Button>
      </PageHeader>

      <CatalogSection
        catalog={catalog}
        isPending={isPending}
        isError={isError}
        refetch={refetch}
        onGenerate={setGenerating}
      />

      <ReportOverview canManage={canManage} />

      {/* {canManage ? (
        <ReportRunsCard
          filters={runFilters}
          onFiltersChange={setRunFilters}
          catalog={definitions}
          onRegenerate={setGenerating}
        />
      ) : null} */}

      <ReportPickerDialog
        open={pickerOpen}
        catalog={definitions}
        isPending={isPending}
        onClose={() => setPickerOpen(false)}
        onPick={(definition) => {
          setPickerOpen(false);
          setGenerating(definition);
        }}
      />

      <GenerateReportDialog
        definition={generating}
        onOpenChange={(open) => !open && setGenerating(null)}
      />
    </div>
  );
}
