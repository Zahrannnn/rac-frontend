"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/shared/components/layout/page-header";
import { ListPagination } from "@/shared/components/list-pagination";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { formatDateTimeUtc, utcDayBounds } from "@/shared/utils/datetime";
import { can, useAuth } from "@/features/auth";
import { useDeleteTraining, useTrainings } from "../hooks/use-trainings";
import type { TrainingDetails, TrainingListFilters, TrainingListItem } from "../types";
import { TrainingDeleteDialog } from "./TrainingDeleteDialog";
import { TrainingDetailDialog } from "./TrainingDetailDialog";
import { TrainingFormDialog } from "./TrainingFormDialog";

const DEFAULT_FILTERS: TrainingListFilters = { page: 1 };

/** Navy shell shared by every header cell of the list table. */
const TABLE_HEAD_CLASS = "h-11 bg-[var(--navy-shell)] text-xs text-white";

export function TrainingsPage() {
  const t = useT();
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrainingListItem | null>(null);

  const { data, isPending, isError, refetch, isPlaceholderData } = useTrainings(filters);
  const remove = useDeleteTraining();
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

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

      {isPending && !data ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
          <p className="text-lg font-semibold text-[var(--navy)]">{t("trainings.empty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("trainings.emptyHint")}</p>
        </div>
      ) : (
        <>
          <div
            className={`overflow-x-auto rounded-lg border bg-card ${isPlaceholderData ? "opacity-70" : ""}`}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.sessionTitle")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.trainerName")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.governorate")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.startAt")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("trainings.attendees")}
                  </TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className={`${TABLE_HEAD_CLASS} w-28`} />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-12 cursor-pointer"
                    onClick={() => setDetailId(row.id)}
                  >
                    <TableCell>
                      <span className="block truncate font-medium text-[var(--navy)]">
                        {row.title || row.venue}
                      </span>
                      <span className="block text-xs text-muted-foreground">{row.venue}</span>
                    </TableCell>
                    <TableCell className="text-sm">{row.trainerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {governorateLabel(row.governorate, locale)}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatDateTimeUtc(row.startAtUtc)}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {row.attendeeCount ?? "—"}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {canEdit ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailId(row.id)}
                            >
                              {t("trainings.open")}
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
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            disabled={isPlaceholderData}
            labels={{
              summary: t("trainings.pageSummary", {
                count: data.totalCount,
                page: filters.page,
                totalPages,
              }),
              previous: t("common.previous"),
              next: t("common.next"),
            }}
          />
        </>
      )}

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
      <TrainingDetailDialog
        trainingId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        canEdit={canEdit}
      />
    </div>
  );
}
