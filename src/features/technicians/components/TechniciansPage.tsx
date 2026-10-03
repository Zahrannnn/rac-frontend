"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/page-header";
import { ListPagination } from "@/shared/components/list-pagination";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useAuth, can } from "@/features/auth";
import { useTechnicians } from "../hooks/use-technicians";
import type { Technician, TechnicianListFilters } from "../types";
import { TechnicianDialog } from "./TechnicianDialog";
import { TechnicianStatusBadge } from "./TechnicianStatusBadge";
import { TechniciansTable } from "./TechniciansTable";

function TechnicianMobileCard({
  technician,
  onOpen,
}: {
  technician: Technician;
  onOpen: () => void;
}) {
  const t = useT();
  const title = technician.fullNameAr || technician.fullName;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--navy)]">{title}</p>
          {technician.specialty ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{technician.specialty}</p>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--secondary)] rtl:rotate-180" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TechnicianStatusBadge status={technician.status} />
        <span className="rounded-md bg-[var(--navy-shell)] px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-white">
          {technician.workshopCode}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums" dir="ltr">
          {technician.mobile}
        </span>
        <span className="tabular-nums">
          {t("technicians.yearsShort", { count: technician.yearsOfExperience })}
        </span>
      </div>
      <span className="sr-only">{t("technicians.openTechnician")}</span>
    </button>
  );
}

export function TechniciansPage() {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const canCreate = Boolean(user && can(user.permissions, "technicians:create"));

  const [filters, setFilters] = useState<TechnicianListFilters>({ page: 1 });
  const [searchDraft, setSearchDraft] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchDraft, 400);

  // Commit the debounced search into the list filters via render-time
  // adjustment (the repo's derived-state idiom — no setState-in-effect).
  const [committedSearch, setCommittedSearch] = useState(debouncedSearch);
  if (committedSearch !== debouncedSearch) {
    setCommittedSearch(debouncedSearch);
    const search = debouncedSearch.trim() || undefined;
    if (filters.search !== search) {
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    }
  }

  const { data, isPending, isPlaceholderData, isError, refetch } = useTechnicians(filters);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;
  const hasFilters = Boolean(filters.search || filters.status || filters.page > 1);

  const openProfile = useCallback(
    (technician: Technician) => router.push(`/technicians/${technician.id}` as Route),
    [router]
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("technicians.title")} description={t("technicians.subtitle")}>
        {canCreate ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus data-icon="inline-start" />
            {t("technicians.add")}
          </Button>
        ) : null}
      </PageHeader>

      <section
        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("technicians.search")}
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <Label htmlFor="tech-search" className="text-primary">
            {t("technicians.search")}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tech-search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="ps-8"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-40">
          <Label>{t("technicians.status")}</Label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === "all" ? undefined : (value as "Active" | "Inactive"),
                page: 1,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("technicians.allStatuses")}</SelectItem>
              <SelectItem value="Active">{t("technicians.statusActive")}</SelectItem>
              <SelectItem value="Inactive">{t("technicians.statusInactive")}</SelectItem>
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
              setFilters({ page: 1 });
            }}
          >
            <X data-icon="inline-start" />
            {t("workshops.clearFilters")}
          </Button>
        ) : null}
      </section>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg md:h-12" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold text-[var(--navy)]">{t("technicians.empty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("technicians.emptyHint")}</p>
          {canCreate ? (
            <Button className="mt-1" variant="secondary" onClick={() => setDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              {t("technicians.add")}
            </Button>
          ) : null}
        </div>
      ) : data ? (
        <>
          <div className={cn(isPlaceholderData && "opacity-60")}>
            <ul className="flex flex-col gap-3 md:hidden">
              {data.items.map((technician) => (
                <li key={technician.id}>
                  <TechnicianMobileCard
                    technician={technician}
                    onOpen={() => openProfile(technician)}
                  />
                </li>
              ))}
            </ul>

            <TechniciansTable technicians={data.items} onOpen={openProfile} />
          </div>

          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            disabled={isPlaceholderData}
            labels={{
              summary: `${t("technicians.totalCount", { count: data.totalCount })} · ${t(
                "workshops.pageOf",
                { page: data.page, total: totalPages }
              )}`,
              previous: t("workshops.prevPage"),
              next: t("workshops.nextPage"),
            }}
          />
        </>
      ) : null}

      <TechnicianDialog open={dialogOpen} onOpenChange={setDialogOpen} technician={null} />
    </div>
  );
}
