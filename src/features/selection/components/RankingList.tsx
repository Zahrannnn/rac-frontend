"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { tierForRank, type RankingSortKey, type SortDirection } from "../utils/ranking";
import type { RankedWorkshop } from "../types";

const SORTABLE_COLUMNS: { key: RankingSortKey; labelKey: "selection.rank" | "selection.workshop" | "selection.governorate" | "selection.score" }[] = [
  { key: "rank", labelKey: "selection.rank" },
  { key: "workshopName", labelKey: "selection.workshop" },
  { key: "governorate", labelKey: "selection.governorate" },
  { key: "totalWeighted", labelKey: "selection.score" },
];

function TierBadge({ rank }: { rank: number }) {
  const t = useT();
  const tier = tierForRank(rank);

  if (tier === "none") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        tier === "recommended"
          ? "bg-primary/15 text-primary"
          : "bg-[var(--accent)] text-[var(--accent-foreground)]"
      )}
    >
      {t(tier === "recommended" ? "selection.tier.recommended" : "selection.tier.reserve")}
    </span>
  );
}

/** The ranked pool: stacked cards on mobile, sortable table from md up. Both open the score sheet. */
export function RankingList({
  rows,
  sort,
  onSort,
  onSelect,
}: {
  rows: RankedWorkshop[];
  sort: { key: RankingSortKey; direction: SortDirection };
  onSort: (key: RankingSortKey) => void;
  onSelect: (workshopId: string) => void;
}) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.workshopId}>
            <button
              type="button"
              onClick={() => onSelect(row.workshopId)}
              className="flex w-full flex-col gap-2 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-primary">
                  {row.workshopCode}
                </span>
                <span className="text-lg font-bold tabular-nums text-primary">
                  {row.totalWeighted.toFixed(2)}
                </span>
              </div>
              <p className="truncate font-semibold text-[var(--navy)]">{row.workshopName}</p>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>#{row.rank}</span>
                <span>{governorateLabel(row.governorate, locale)}</span>
                <TierBadge rank={row.rank} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {SORTABLE_COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  className="h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white"
                  aria-sort={
                    sort.key === column.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-white/80"
                    onClick={() => onSort(column.key)}
                  >
                    {t(column.labelKey)}
                    {sort.key === column.key ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </button>
                </TableHead>
              ))}
              <TableHead className="h-11 w-28 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("selection.tier")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.workshopId}
                tabIndex={0}
                className="h-12 cursor-pointer focus-visible:bg-[var(--row-selected)]"
                onClick={() => onSelect(row.workshopId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.workshopId);
                  }
                }}
              >
                <TableCell className="tabular-nums font-bold text-[var(--navy)]">
                  #{row.rank}
                </TableCell>
                <TableCell>
                  <span className="block truncate font-medium text-[var(--navy)]">
                    {row.workshopName}
                  </span>
                  <span className="block font-mono text-xs text-primary">
                    {row.workshopCode}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {governorateLabel(row.governorate, locale)}
                </TableCell>
                <TableCell className="tabular-nums text-base font-bold text-primary">
                  {row.totalWeighted.toFixed(2)}
                </TableCell>
                <TableCell>
                  <TierBadge rank={row.rank} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
