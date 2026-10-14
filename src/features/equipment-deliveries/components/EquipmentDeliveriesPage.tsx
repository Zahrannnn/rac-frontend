"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc, utcDayBounds } from "@/shared/utils/datetime";
import { can, useAuth } from "@/features/auth";
import { useDeleteDelivery, useDeliveries } from "../hooks/use-equipment";
import type { DeliveryListFilters, EquipmentDelivery } from "../types";
import { DeleteDeliveryDialog } from "./DeleteDeliveryDialog";
import { DeliveryDetailDialog } from "./DeliveryDetailDialog";
import { DeliveryFormDialog } from "./DeliveryFormDialog";

const DEFAULT_FILTERS: DeliveryListFilters = { page: 1 };

export function EquipmentDeliveriesPage() {
  const t = useT();
  const { user } = useAuth();
  const canCreate = Boolean(user && can(user.permissions, "equipment:create"));
  const canEdit = Boolean(user && can(user.permissions, "equipment:edit"));
  const canDelete = Boolean(user && can(user.permissions, "equipment:delete"));

  const [filters, setFilters] = useState<DeliveryListFilters>(DEFAULT_FILTERS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentDelivery | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EquipmentDelivery | null>(null);

  const { data, isPending, isError, refetch, isPlaceholderData } = useDeliveries(filters);
  const remove = useDeleteDelivery();
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  // Server-paged registry — the API owns the order, so no client sortValue here.
  const columns: DataTableColumn<EquipmentDelivery>[] = [
    {
      key: "workshop",
      header: t("equipment.workshop"),
      cell: (row) => (
        <button
          type="button"
          className="block w-full text-start"
          onClick={() => setDetailId(row.id)}
        >
          <span className="block font-mono text-xs text-primary">{row.workshopCode}</span>
          <span className="block truncate text-sm font-medium">{row.workshopName}</span>
        </button>
      ),
    },
    {
      key: "description",
      header: t("equipment.description"),
      className: "max-w-[20ch] truncate",
      cell: (row) => (
        <span className="block truncate text-sm" title={row.equipmentDescription}>
          {row.equipmentDescription}
        </span>
      ),
    },
    {
      key: "recipient",
      header: t("equipment.recipientName"),
      cell: (row) => <span className="text-sm">{row.recipientName}</span>,
    },
    {
      key: "deliveredAt",
      header: t("equipment.deliveredAt"),
      cell: (row) => (
        <span className="text-sm tabular-nums">{formatDateTimeUtc(row.deliveredAtUtc)}</span>
      ),
    },
    {
      key: "photos",
      header: t("equipment.photos"),
      cell: (row) => <span className="text-sm tabular-nums">{row.photoCount}</span>,
    },
    ...(canDelete
      ? [
          {
            key: "actions",
            header: "",
            className: "w-16",
            // The row opens the detail dialog — keep the delete click to itself.
            cell: (row: EquipmentDelivery) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={remove.isPending}
                  onClick={() => setPendingDelete(row)}
                  aria-label={t("equipment.delete")}
                  title={t("equipment.delete")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ),
          } satisfies DataTableColumn<EquipmentDelivery>,
        ]
      : []),
  ];

  const onDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success(t("equipment.deleted"));
      },
      onError: () => toast.error(t("equipment.deleteFailed")),
    });
  };

  const applyDateRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      ...utcDayBounds(from, to),
    }));
  };

  const clearDateRange = () => {
    setDateFrom("");
    setDateTo("");
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("equipment.title")} description={t("equipment.subtitle")}>
        {canCreate ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            {t("equipment.create")}
          </Button>
        ) : null}
      </PageHeader>

      <section
        className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
        aria-label={t("equipment.filters")}
      >
        <div className="flex w-full flex-col gap-1.5 sm:w-72">
          <Label>{t("equipment.dateRange")}</Label>
          <DateRangePicker
            value={{ from: dateFrom || undefined, to: dateTo || undefined }}
            onChange={(range) => applyDateRange(range.from ?? "", range.to ?? "")}
          />
        </div>
        {dateFrom || dateTo ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearDateRange}>
            <X data-icon="inline-start" />
            {t("workshops.clearFilters")}
          </Button>
        ) : null}
      </section>

      <DataTable<EquipmentDelivery>
        columns={columns}
        data={data?.items}
        getRowId={(row) => row.id}
        ariaLabel={t("equipment.title")}
        onRowClick={(row) => setDetailId(row.id)}
        isLoading={isPending && !data}
        loadingRows={5}
        error={isError}
        onRetry={() => refetch()}
        emptyState={{
          title: t("equipment.empty"),
          hint: t("equipment.emptyHint"),
          action: canCreate ? (
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus data-icon="inline-start" aria-hidden />
              {t("equipment.create")}
            </Button>
          ) : undefined,
        }}
        pagination={{
          page: filters.page,
          totalPages,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
          summary: t("equipment.pageSummary", {
            count: data?.totalCount ?? 0,
            page: filters.page,
            totalPages,
          }),
          disabled: isPlaceholderData,
        }}
        className={isPlaceholderData ? "opacity-70" : undefined}
      />

      <DeleteDeliveryDialog
        pendingDelete={pendingDelete}
        isPending={remove.isPending}
        onConfirm={onDelete}
        onClose={() => setPendingDelete(null)}
      />

      <DeliveryFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <DeliveryDetailDialog
        deliveryId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        canEdit={canEdit}
        onEdit={() => {
          const row = data?.items.find((i) => i.id === detailId);
          if (row) {
            setEditing(row);
            setFormOpen(true);
          }
        }}
      />
    </div>
  );
}
