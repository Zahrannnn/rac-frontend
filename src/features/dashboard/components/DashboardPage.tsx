"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { isAssignedSummary, isFullSummary } from "../types";
import { useDashboardSummary } from "../hooks/use-dashboard-summary";
import { useDashboardUrlFilters } from "../hooks/use-dashboard-url-filters";
import { AssignedDashboard } from "./AssignedDashboard";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { FullDashboard } from "./FullDashboard";

export function DashboardPage() {
  const t = useT();
  const { filters, setFilters } = useDashboardUrlFilters();
  const { data, isPending, isError, error, refetch, isFetching } = useDashboardSummary(filters);

  useEffect(() => {
    if (isError && error) {
      const status = (error as { status?: number }).status;

      if (status === 403) {
        toast.error(t("error.permissionDenied"));
      } else if (status === 404) {
        toast.error(t("error.notFoundToast"));
      }
    }
  }, [error, isError, t]);

  return (
    <>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />

      {isPending && !data ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("common.error")}</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : data ? (
        <div className={isFetching ? "opacity-80 transition-opacity duration-150" : undefined}>
          {isAssignedSummary(data) ? (
            <AssignedDashboard summary={data} />
          ) : isFullSummary(data) ? (
            <FullDashboard summary={data} filters={filters} onFiltersChange={setFilters} />
          ) : (
            <ExecutiveDashboard summary={data} filters={filters} onFiltersChange={setFilters} />
          )}
        </div>
      ) : null}
    </>
  );
}
