"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
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
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc, utcDayBounds } from "@/shared/utils/datetime";
import { can, useAuth } from "@/features/auth";
import { useDeleteDelivery, useDeliveries } from "../hooks/use-equipment";
import type { DeliveryListFilters, EquipmentDelivery } from "../types";
import { DeleteDeliveryDialog } from "./DeleteDeliveryDialog";
import { DeliveryDetailDialog } from "./DeliveryDetailDialog";
import { DeliveryFormDialog } from "./DeliveryFormDialog";

const DEFAULT_FILTERS: DeliveryListFilters = { page: 1 };
const HEADER_CELL_CLASS = "h-11 bg-[var(--navy-shell)] text-xs text-white";

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
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="text-lg font-semibold text-[var(--navy)]">{t("equipment.empty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("equipment.emptyHint")}</p>
        </div>
      ) : (
        <>
          <div
            className={`overflow-x-auto rounded-lg border bg-card ${isPlaceholderData ? "opacity-70" : ""}`}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={HEADER_CELL_CLASS}>
                    {t("equipment.workshop")}
                  </TableHead>
                  <TableHead className={HEADER_CELL_CLASS}>
                    {t("equipment.description")}
                  </TableHead>
                  <TableHead className={HEADER_CELL_CLASS}>
                    {t("equipment.recipientName")}
                  </TableHead>
                  <TableHead className={HEADER_CELL_CLASS}>
                    {t("equipment.deliveredAt")}
                  </TableHead>
                  <TableHead className={HEADER_CELL_CLASS}>
                    {t("equipment.photos")}
                  </TableHead>
                  {canDelete && <TableHead className={`w-28 ${HEADER_CELL_CLASS}`} />}
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
                      <span className="block font-mono text-xs text-primary">{row.workshopCode}</span>
                      <span className="block truncate text-sm font-medium">{row.workshopName}</span>
                    </TableCell>
                    <TableCell className="max-w-[20ch] truncate text-sm">
                      {row.equipmentDescription}
                    </TableCell>
                    <TableCell className="text-sm">{row.recipientName}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatDateTimeUtc(row.deliveredAtUtc)}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">{row.photoCount}</TableCell>
                    {canDelete && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              disabled={remove.isPending}
                              onClick={() => setPendingDelete(row)}
                            >
                              {t("equipment.delete")}
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
              summary: t("equipment.pageSummary", {
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
