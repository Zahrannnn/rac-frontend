import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DataTableColumn } from "@/shared/components/data-table/data-table";
import { governorateLabel } from "@/shared/constants/egypt";
import { trainingDetail } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import type { TrainingListItem } from "../types";

/**
 * Column set of the trainings registry — server-paged, so no client sortValue.
 * The row navigates to the detail page, so action clicks stop propagation.
 */
export function buildTrainingColumns({
  t,
  locale,
  canEdit,
  canDelete,
  deletePending,
  onDelete,
}: {
  t: ReturnType<typeof useT>;
  locale: ReturnType<typeof useI18n>["locale"];
  canEdit: boolean;
  canDelete: boolean;
  deletePending: boolean;
  onDelete: (row: TrainingListItem) => void;
}): DataTableColumn<TrainingListItem>[] {
  return [
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
                    disabled={deletePending}
                    onClick={() => onDelete(row)}
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
}
