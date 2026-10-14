"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMounted } from "@/shared/hooks/use-mounted";
import { PageBreadcrumbs } from "@/shared/components/layout/page-breadcrumbs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table/data-table";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { can, useAuth } from "@/features/auth";
import { StatusBadge, TypeBadge } from "./badges";
import { useWorkshops } from "../hooks/use-workshops";
import { filtersToSearchParams, parseWorkshopFilters } from "../utils/filter-state";
import { formatDateUtc, governorateLabel, workshopDisplayName } from "../utils/format";
import { LIFECYCLE_ORDER, type Workshop, type WorkshopListFilters, type WorkshopStatus } from "../types";

function WorkshopMobileCard({
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

export function WorkshopsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const mounted = useMounted();
  // Permission-driven (not role-based): FieldTeams hold workshops:create/edit,
  // so they get the register entry point; assignment stays workshops:assign-only.
  const canCreate = mounted && Boolean(user && can(user.permissions, "workshops:create"));

  const [filters, setFilters] = useState<WorkshopListFilters>(() =>
    parseWorkshopFilters(new URLSearchParams(searchParams.toString()))
  );
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [districtDraft, setDistrictDraft] = useState(filters.district ?? "");

  useEffect(() => {
    const query = filtersToSearchParams(filters).toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }, [filters, router]);

  useEffect(() => {
    const current = filters.search ?? "";
    if (searchDraft === current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchDraft.trim() || undefined, page: 1 }));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [filters.search, searchDraft]);

  // District filter commits on its own debounce (server-side contains match).
  useEffect(() => {
    const current = filters.district ?? "";
    if (districtDraft === current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, district: districtDraft.trim() || undefined, page: 1 }));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [districtDraft, filters.district]);

  const { data, isPending, isPlaceholderData, isError, refetch } = useWorkshops(filters);

  const setFilter = useCallback((patch: Partial<WorkshopListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;
  const hasFilters = Boolean(
    filters.search || filters.governorate || filters.district || filters.status || filters.page > 1
  );

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

      <section
        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("workshops.search")}
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <Label htmlFor="workshop-search" className="text-primary">
            {t("workshops.search")}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="workshop-search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="ps-8"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-44">
          <Label>{t("workshops.governorateFilter")}</Label>
          <Select
            value={filters.governorate ?? "all"}
            onValueChange={(value) => setFilter({ governorate: value === "all" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("workshops.allGovernorates")}</SelectItem>
              {GOVERNORATES.map((governorate) => (
                <SelectItem key={governorate} value={governorate}>
                  {governorateLabel(governorate, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-44">
          <Label htmlFor="workshop-district">{t("workshops.filterDistrict")}</Label>
          <Input
            id="workshop-district"
            value={districtDraft}
            onChange={(event) => setDistrictDraft(event.target.value)}
            placeholder={t("workshops.districtHint")}
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-40">
          <Label>{t("workshops.statusFilter")}</Label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              setFilter({ status: value === "all" ? undefined : (value as WorkshopStatus) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("workshops.allStatuses")}</SelectItem>
              {LIFECYCLE_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.${status}` as const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="text-[var(--secondary)] hover:text-[var(--secondary)]"
            onClick={() => {
              setSearchDraft("");
              setDistrictDraft("");
              setFilters({ page: 1 });
            }}
          >
            <X data-icon="inline-start" />
            {t("workshops.clearFilters")}
          </Button>
        ) : null}
      </section>

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
