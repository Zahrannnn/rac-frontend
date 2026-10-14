"use client";

import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useI18n, useT } from "@/shared/i18n";
import { governorateLabel } from "@/shared/constants/egypt";
import type { SelectionRunRankedRow } from "../types";
import { tierLabelKey } from "../utils/rubric";

/** Tier text badge — status is never color alone (DESIGN.md). */
export function TierBadge({ tier }: { tier: string }) {
  const t = useT();
  const labelKey = tierLabelKey(tier);

  if (!labelKey) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
      {t(labelKey)}
    </span>
  );
}

/**
 * One tier of a frozen run snapshot — every row opens the live scorecard dialog
 * (the traceability view). Rows are 48px with tabular figures per DESIGN.md.
 * Rank order IS the content: only the workshop name is client-sortable; rank,
 * score and tier keep the server's ranking order.
 */
export function RunRankingTable({
  rows,
  onOpenScorecard,
}: {
  rows: SelectionRunRankedRow[];
  onOpenScorecard: (row: { id: string; label: string }) => void;
}) {
  const t = useT();
  const { locale } = useI18n();

  const columns: DataTableColumn<SelectionRunRankedRow>[] = [
    {
      key: "rank",
      header: t("selection.rank"),
      cell: (row) => <span className="tabular-nums font-semibold">#{row.rank}</span>,
    },
    {
      key: "workshop",
      header: t("selection.workshop"),
      sortValue: (row) => row.workshopName,
      cell: (row) => (
        <>
          <span className="block truncate font-medium">{row.workshopName}</span>
          <span className="block font-mono text-xs text-primary">{row.workshopCode}</span>
        </>
      ),
    },
    {
      key: "governorate",
      header: t("selection.governorate"),
      className: "text-sm text-muted-foreground",
      cell: (row) => governorateLabel(row.governorate, locale),
    },
    {
      key: "score",
      header: t("selection.score"),
      className: "tabular-nums font-bold text-primary",
      cell: (row) => row.totalScore.toLocaleString("en-US"),
    },
    {
      key: "tier",
      header: t("selection.tier"),
      cell: (row) => <TierBadge tier={row.tier} />,
    },
    {
      key: "scorecard",
      header: "",
      headerClassName: "w-24",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onOpenScorecard({
              id: row.workshopId,
              label: `${row.workshopCode} — ${row.workshopName}`,
            })
          }
          title={t("selection.scorecard.title")}
        >
          <FileSearch className="h-4 w-4" aria-hidden />
          <span className="sr-only">
            {t("selection.scorecard.openFor", { name: row.workshopName })}
          </span>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.workshopId}
      ariaLabel={t("selection.runs.rankedTitle")}
      emptyState={{ title: t("selection.runs.emptyTier") }}
    />
  );
}
