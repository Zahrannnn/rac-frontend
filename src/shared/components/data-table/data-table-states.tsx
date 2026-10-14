"use client";

import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { QueryErrorState } from "@/shared/components/query-states";
import { useT } from "@/shared/i18n";
import type { DataTableEmptyState } from "./data-table-types";

/**
 * The three non-data body states of the DataTable — loading skeletons, the
 * query error row and the empty row. Each spans the full column count.
 */

/** Shimmering skeleton rows (one cell per column) shown while loading. */
export function DataTableSkeletonRows({
  columns,
  rowCount,
}: {
  columns: readonly { key: string; className?: string }[];
  rowCount: number;
}) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
          {columns.map((column) => (
            <TableCell key={column.key} className={column.className}>
              <Skeleton className="h-4 w-4/5 max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Query failure row with the shared retry action. */
export function DataTableErrorRow({
  colSpan,
  onRetry,
}: {
  colSpan: number;
  onRetry?: () => void;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-6">
        <QueryErrorState
          onRetry={onRetry ?? (() => undefined)}
          className="justify-center"
        />
      </TableCell>
    </TableRow>
  );
}

/** Empty-result row: caller title/hint/action, falling back to the shared label. */
export function DataTableEmptyRow({
  colSpan,
  emptyState,
}: {
  colSpan: number;
  emptyState?: DataTableEmptyState;
}) {
  const t = useT();

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Inbox aria-hidden className="size-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-[var(--navy)]">
            {emptyState?.title ?? t("table.emptyTitle")}
          </p>
          {emptyState?.hint ? (
            <p className="max-w-[44ch] text-sm text-muted-foreground">
              {emptyState.hint}
            </p>
          ) : null}
          {emptyState?.action ? (
            <div className="pt-2">{emptyState.action}</div>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
