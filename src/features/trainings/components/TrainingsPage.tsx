"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { PageHeader } from "@/shared/components/layout/page-header";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { trainingDetail } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import { formatDateTimeUtc, utcDayBounds } from "@/shared/utils/datetime";
import { can, useAuth } from "@/features/auth";
import { useDeleteTraining, useTrainings } from "../hooks/use-trainings";
import type { TrainingDetails, TrainingListFilters, TrainingListItem } from "../types";
import { TrainingDeleteDialog } from "./TrainingDeleteDialog";
import { TrainingFormDialog } from "./TrainingFormDialog";

const DEFAULT_FILTERS: TrainingListFilters = { page: 1 };

export function TrainingsPage() {
  const t = useT();
  const router = useRouter();
  const { locale } = useI18n();
  const { user } = useAuth();
  const canCreate = Boolean(user && can(user.permissions, "trainings:create"));
  const canEdit = Boolean(user && can(user.permissions, "trainings:edit"));
  const canDelete = Boolean(user && can(user.permissions, "trainings:delete"));

  const [filters, setFilters] = useState<TrainingListFilters>(DEFAULT_FILTERS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingDetails | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrainingListItem | null>(null);

  const { data, isPending, isError, refetch, isPlaceholderData } = useTrainings(filters);
  const remove = useDeleteTraining();
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  // Server-paged registry — the API owns the order, so no client sortValue here.
  const columns: DataTableColumn<TrainingListItem>[] = [
    {
      key: "title",
      header: t("trainings.sessionTitle"),
      cell: (row) => (
        <div>
          <Link
            href={trainingDetail(row.id)}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-[var(--navy)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {row.title || row.venue}
          </Link>
          <span className="block text-xs text-muted-foreground">{row.venue}</span>
        </div>
      ),
    },
    {
      key: "trainer",
      header: t("trainings.trainerName"),
      cell: (row) => <span className="text-sm">{row.trainerName}</span>,
    },
    {
      key: "governorate",
      header: t("trainings.governorate"),
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {governorateLabel(row.governorate, locale)}
        </span>
      ),
    },
    {
      key: "startAt",
      header: t("trainings.startAt"),
      cell: (row) => (
        <span className="text-sm tabular-nums">{formatDateTimeUtc(row.startAtUtc)}</span>
      ),
    },
    {
      key: "attendees",
      header: t("trainings.attendees"),
      cell: (row) => <span className="text-sm tabular-nums">{row.attendeeCount ?? "—"}</span>,
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: "",
            className: "w-28",
            // The row navigates to the detail page — keep action clicks to themselves.
            cell: (row: TrainingListItem) => (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {canEdit ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={trainingDetail(row.id)}>{t("trainings.open")}</Link>
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={remove.isPending}
                    onClick={() => setPendingDelete(row)}
                  >
                    {t("trainings.delete")}
                  </Button>
                ) : null}
              </div>
            ),
          } satisfies DataTableColumn<TrainingListItem>,
        ]
      : []),
  ];

  const setFilter = (patch: Partial<TrainingListFilters>) =>
    setFilters((prev) => ({ ...prev, page: 1, ...patch }));

  const applyDateRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setFilter({
      ...utcDayBounds(from, to),
    });
  };

  const onDelete = () => {
    if (!pendingDelete) {
      return;
    }
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success(t("trainings.deleted"));
      },
      onError: () => toast.error(t("trainings.deleteFailed")),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("trainings.title")} description={t("trainings.subtitle")}>
        {canCreate ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            {t("trainings.create")}
          </Button>
        ) : null}
      </PageHeader>

      <section
        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("trainings.filters")}
      >
        <div className="flex w-full flex-col gap-1.5 sm:w-56">
          <Label>{t("trainings.governorate")}</Label>
          <Select
            value={filters.governorate ?? "all"}
            onValueChange={(value) =>
              setFilter({ governorate: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("trainings.allGovernorates")}</SelectItem>
              {GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {governorateLabel(g, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-72">
          <Label>{t("trainings.dateRange")}</Label>
          <DateRangePicker
            value={{
              from: dateFrom || undefined,
              to: dateTo || undefined,
            }}
            onChange={(range) => applyDateRange(range.from ?? "", range.to ?? "")}
          />
        </div>
      </section>

      <DataTable<TrainingListItem>
        columns={columns}
        data={data?.items}
        getRowId={(row) => row.id}
        ariaLabel={t("trainings.title")}
        onRowClick={(row) => router.push(trainingDetail(row.id))}
        isLoading={isPending && !data}
        loadingRows={5}
        error={isError}
        onRetry={() => refetch()}
        emptyState={{ title: t("trainings.empty"), hint: t("trainings.emptyHint") }}
        pagination={{
          page: filters.page,
          totalPages,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
          summary: t("trainings.pageSummary", {
            count: data?.totalCount ?? 0,
            page: filters.page,
            totalPages,
          }),
          disabled: isPlaceholderData,
        }}
        className={isPlaceholderData ? "opacity-70" : undefined}
      />

      <TrainingDeleteDialog
        pendingDelete={pendingDelete}
        isPending={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setPendingDelete(null)}
      />

      <TrainingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
    </div>
  );
}
