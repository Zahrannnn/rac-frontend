import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import type { EquipmentDelivery } from "../types";

/**
 * Column set of the deliveries registry — server-paged, so no client sortValue.
 * The row opens the detail dialog, so the delete click stops propagation.
 */
export function buildDeliveryColumns({
  t,
  canDelete,
  deletePending,
  onOpenDetail,
  onDelete,
}: {
  t: ReturnType<typeof useT>;
  canDelete: boolean;
  deletePending: boolean;
  onOpenDetail: (id: string) => void;
  onDelete: (row: EquipmentDelivery) => void;
}): DataTableColumn<EquipmentDelivery>[] {
  return [
    {
      key: "workshop",
      header: t("equipment.workshop"),
      cell: (row) => (
        <button
          type="button"
          className="block w-full text-start"
          onClick={() => onOpenDetail(row.id)}
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
                  disabled={deletePending}
                  onClick={() => onDelete(row)}
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
}
