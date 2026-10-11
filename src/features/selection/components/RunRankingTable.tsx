"use client";

import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("selection.runs.emptyTier")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.rank")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.workshop")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.governorate")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.score")}
            </TableHead>
            <TableHead className="h-10 bg-[var(--navy-shell)] text-xs text-white">
              {t("selection.tier")}
            </TableHead>
            <TableHead className="h-10 w-24 bg-[var(--navy-shell)] text-xs text-white">
              <span className="sr-only">{t("selection.scorecard.title")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.workshopId} className="h-12">
              <TableCell className="tabular-nums font-semibold">#{row.rank}</TableCell>
              <TableCell>
                <span className="block truncate font-medium">{row.workshopName}</span>
                <span className="block font-mono text-xs text-primary">{row.workshopCode}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {governorateLabel(row.governorate, locale)}
              </TableCell>
              <TableCell className="tabular-nums font-bold text-primary">
                {row.totalScore.toLocaleString("en-US")}
              </TableCell>
              <TableCell>
                <TierBadge tier={row.tier} />
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
