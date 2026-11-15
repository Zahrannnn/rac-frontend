"use client";

import { useState } from "react";
import { FileBarChart, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useReportCatalog } from "../hooks/use-reports";
import type { ReportDefinition } from "../types";
import { CatalogSection } from "./CatalogSection";
import { GasConsumptionMapTab } from "./GasConsumptionMapTab";
import { GenerateReportDialog } from "./GenerateReportDialog";
import { ReportOverview } from "./ReportOverview";
import { ReportPickerDialog } from "./ReportPickerDialog";

/**
 * Reports analytics surface: header + generate action, and two tabs — the
 * catalog + overview (default) and the annual gas consumption map
 * (REGISTRY-GAS-SPEC §6). Visibility follows the existing reports route
 * gating — no feature-scope change. Client component (TanStack Query data
 * surfaces).
 */
export function ReportsPage() {
  const t = useT();
  const { user } = useAuth();
  const canManage = Boolean(user && can(user.permissions, "reports:manage"));

  const { data: catalog, isPending, isError, refetch } = useReportCatalog();
  const [generating, setGenerating] = useState<ReportDefinition | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<"catalog" | "gas-map">("catalog");

  const definitions = catalog ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("reports.title")} description={t("reports.subtitle")}>
        <Button type="button" onClick={() => setPickerOpen(true)}>
          <FileBarChart data-icon="inline-start" />
          {t("reports.generate")}
        </Button>
      </PageHeader>

      {/* Tab strip — role="tablist"/"tab" with aria-selected (RTL-safe: logical
          order flows with the document direction). */}
      <div
        role="tablist"
        aria-label={t("reports.title")}
        className="flex w-fit gap-1 rounded-lg border bg-muted/40 p-1"
      >
        <button
          type="button"
          role="tab"
          id="reports-tab-catalog"
          aria-selected={tab === "catalog"}
          aria-controls="reports-panel-catalog"
          onClick={() => setTab("catalog")}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tab === "catalog"
              ? "bg-card text-[var(--navy)] shadow-sm"
              : "text-muted-foreground hover:text-[var(--navy)]"
          }`}
        >
          {t("reports.catalogTab")}
        </button>
        <button
          type="button"
          role="tab"
          id="reports-tab-gas-map"
          aria-selected={tab === "gas-map"}
          aria-controls="reports-panel-gas-map"
          onClick={() => setTab("gas-map")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tab === "gas-map"
              ? "bg-card text-[var(--navy)] shadow-sm"
              : "text-muted-foreground hover:text-[var(--navy)]"
          }`}
        >
          <MapPinned className="h-4 w-4" aria-hidden />
          {t("reports.mapTab")}
        </button>
      </div>

      {tab === "catalog" ? (
        <div
          role="tabpanel"
          id="reports-panel-catalog"
          aria-labelledby="reports-tab-catalog"
          className="flex flex-col gap-5"
        >
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
        </div>
      ) : (
        <div
          role="tabpanel"
          id="reports-panel-gas-map"
          aria-labelledby="reports-tab-gas-map"
        >
          <GasConsumptionMapTab />
        </div>
      )}

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
