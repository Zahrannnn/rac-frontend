"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/shared/hooks/use-mounted";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table/data-table";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { can, useAuth } from "@/features/auth";
import { StatusBadge, TypeBadge } from "./badges";
import { useWorkshops } from "../hooks/use-workshops";
import { useWorkshopFilters } from "../hooks/use-workshop-filters";
import { formatDateUtc, governorateLabel, workshopDisplayName } from "../utils/format";
import type { Workshop } from "../types";
import { WorkshopMobileCard } from "./WorkshopMobileCard";
import { WorkshopsFilterBar } from "./WorkshopsFilterBar";

export function WorkshopsPage() {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const mounted = useMounted();
  // Permission-driven (not role-based): FieldTeams hold workshops:create/edit,
  // so they get the register entry point; assignment stays workshops:assign-only.
  const canCreate = mounted && Boolean(user && can(user.permissions, "workshops:create"));

  const {
    filters,
    setFilters,
    setFilter,
    searchDraft,
    setSearchDraft,
    districtDraft,
    setDistrictDraft,
    hasFilters,
    clearFilters,
  } = useWorkshopFilters();

  const { data, isPending, isPlaceholderData, isError, refetch } = useWorkshops(filters);

  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  function openWorkshop(id: string) {
    router.push(`/workshops/${id}` as Route);
  }

  // Server-paged registry: the API fixes the row order, so no sortValue —
  // sorting one page would mislead.
  const columns: DataTableColumn<Workshop>[] = [
    {
      key: "code",
      header: t("workshops.colCode"),
      className: "w-[9.5rem]",
      cell: (workshop) => (
        <span className="font-mono text-xs font-semibold text-primary">{workshop.code}</span>
      ),
    },
    {
      key: "name",
      header: t("workshops.colName"),
      cell: (workshop) => (
        <>
          <span className="block font-medium text-[var(--navy)]">
            {workshopDisplayName(workshop)}
          </span>
          {workshop.nameAr ? (
            <span className="block text-xs text-muted-foreground">{workshop.nameEn}</span>
          ) : null}
        </>
      ),
    },
    {
      key: "governorate",
      header: t("workshops.colGovernorate"),
      className: "w-[8rem]",
      cell: (workshop) => governorateLabel(workshop.governorate, locale),
    },
    {
      key: "type",
      header: t("workshops.colType"),
      className: "w-[7.5rem]",
      cell: (workshop) => <TypeBadge type={workshop.type} />,
    },
    {
      key: "status",
      header: t("workshops.colStatus"),
      className: "w-[7rem]",
      cell: (workshop) => <StatusBadge status={workshop.status} />,
    },
    {
      key: "created",
      header: t("workshops.colCreated"),
      className: "w-[8rem]",
      cell: (workshop) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateUtc(workshop.createdAtUtc)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageBreadcrumbs items={[{ label: t("workshops.title") }]} />
      <PageHeader title={t("workshops.title")} description={t("workshops.subtitle")}>
        {canCreate ? (
          <Button onClick={() => router.push("/workshops/new" as Route)}>
            <Plus data-icon="inline-start" />
            {t("workshops.register")}
          </Button>
        ) : null}
      </PageHeader>

      <WorkshopsFilterBar
        filters={filters}
        searchDraft={searchDraft}
        districtDraft={districtDraft}
        onSearchDraftChange={setSearchDraft}
        onDistrictDraftChange={setDistrictDraft}
        onFilterChange={setFilter}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      {isPending || isError || data ? (
        <div className={cn(isPlaceholderData && "opacity-60")}>
          <DataTable
            columns={columns}
            data={data?.items}
            getRowId={(workshop) => workshop.id}
            ariaLabel={t("workshops.title")}
            onRowClick={(workshop) => openWorkshop(workshop.id)}
            isLoading={isPending}
            error={isError}
            onRetry={() => refetch()}
            emptyState={{
              title: t("workshops.empty"),
              hint: t("workshops.emptyHint"),
              action: canCreate ? (
                <Button
                  variant="secondary"
                  onClick={() => router.push("/workshops/new" as Route)}
                >
                  <Plus data-icon="inline-start" />
                  {t("workshops.register")}
                </Button>
              ) : undefined,
            }}
            pagination={
              data
                ? {
                    page: filters.page,
                    totalPages,
                    onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
                    summary: `${t("workshops.totalCount", { count: data.totalCount })} · ${t(
                      "workshops.pageOf",
                      { page: data.page, total: totalPages }
                    )}`,
                    disabled: isPlaceholderData,
                  }
                : undefined
            }
            mobileCard={(workshop) => (
              <WorkshopMobileCard
                workshop={workshop}
                locale={locale}
                onOpen={() => openWorkshop(workshop.id)}
              />
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
