"use client";

import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { ListPagination } from "@/shared/components/list-pagination";
import { QueryErrorState } from "@/shared/components/query-states";

/**
 * The app's single data-table implementation. One navy header shell, 48px rows
 * (40px compact), accessible sortable headers, loading/error/empty states and
 * the shared pagination footer — features supply columns, data and cell
 * renderers only.
 *
 * Sorting is CLIENT-side over the rows you pass. Pass `sortValue` only when
 * `data` is the full dataset (client lists); on server-paged registries the
 * API returns a fixed order, so leave it off rather than sorting one page.
 *
 * RTL-safe by construction: alignment uses logical utilities (start/end) and
 * the header shell works mirrored.
 */

export type DataTableColumn<T> = {
  /** Unique column id (stable across renders). */
  key: string;
  /** Already-translated header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Enables client sorting on this column. See the sorting caveat above. */
  sortValue?: (row: T) => string | number;
  /** Initial sort direction when the column is the first sorted one. */
  sortDescFirst?: boolean;
  align?: "start" | "center" | "end";
  /** Extra classes for the th/td pair (widths, tabular-nums, …). */
  className?: string;
  headerClassName?: string;
};

export type DataTablePagination = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Ready-formatted "N results · page X of Y" summary from the caller's i18n. */
  summary: string;
  disabled?: boolean;
};

export type DataTableEmptyState = {
  title: string;
  hint?: string;
  action?: ReactNode;
};

export type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  data: readonly T[] | undefined;
  getRowId: (row: T) => string;
  /** Accessible name (sr-only caption) for the table. */
  ariaLabel: string;
  /** Rows become focusable and Enter/Space-activated. */
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyState?: DataTableEmptyState;
  pagination?: DataTablePagination;
  /** Optional card renderer swapped in for <md screens. */
  mobileCard?: (row: T) => ReactNode;
  density?: "default" | "compact";
  /** Sticky navy header; needs a scroll parent (max-h) to matter. */
  stickyHeader?: boolean;
  /** Per-row extra classes (e.g. a transient tint for a just-added row). */
  rowClassName?: (row: T) => string | undefined;
  /** Skeleton row count while loading (default 6). */
  loadingRows?: number;
  initialSorting?: SortingState;
  className?: string;
};

const ALIGN_CLASS = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;

export function DataTable<T>({
  columns,
  data,
  getRowId,
  ariaLabel,
  onRowClick,
  isLoading = false,
  error = false,
  onRetry,
  emptyState,
  pagination,
  mobileCard,
  density = "default",
  stickyHeader = false,
  rowClassName,
  loadingRows = 6,
  initialSorting = [],
  className,
}: DataTableProps<T>) {
  const t = useT();
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data: data as T[],
    columns: columns.map(
      (column): ColumnDef<T, string | number> => ({
        id: column.key,
        header: column.header,
        cell: (info) => column.cell(info.row.original),
        ...(column.sortValue
          ? {
              accessorFn: (row: T) => column.sortValue!(row),
              sortingFn: "basic" as const,
              sortDescFirst: column.sortDescFirst,
            }
          : { enableSorting: false }),
      })
    ),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rowHeight = density === "compact" ? "h-10" : "h-12";
  const showMobileCards = Boolean(mobileCard) && !isLoading && !error && (data?.length ?? 0) > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showMobileCards ? (
        <ul className="flex flex-col gap-3 md:hidden">
          {(data ?? []).map((row) => (
            <li key={getRowId(row)}>{mobileCard!(row)}</li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card",
          showMobileCards && "hidden md:block",
          stickyHeader && "max-h-[70vh] overflow-auto"
        )}
      >
        <Table aria-label={ariaLabel} aria-busy={isLoading || undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const column = columns[header.column.getIndex()];
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const align = column?.align ?? "start";
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : canSort
                              ? "none"
                              : undefined
                      }
                      className={cn(
                        "h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white",
                        stickyHeader && "sticky top-0 z-10",
                        align !== "start" && ALIGN_CLASS[align],
                        column?.headerClassName
                      )}
                    >
                      {canSort ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {column?.header}
                          {sorted === "asc" ? (
                            <ArrowUp aria-hidden className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown aria-hidden className="size-3.5" />
                          ) : (
                            <ChevronsUpDown
                              aria-hidden
                              className="size-3.5 opacity-60"
                            />
                          )}
                        </Button>
                      ) : (
                        column?.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: loadingRows }, (_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      <Skeleton className="h-4 w-4/5 max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-6">
                  <QueryErrorState
                    onRetry={onRetry ?? (() => undefined)}
                    className="justify-center"
                  />
                </TableCell>
              </TableRow>
            ) : (data?.length ?? 0) === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-10">
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
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    rowHeight,
                    onRowClick && "cursor-pointer focus-visible:bg-[var(--row-selected)]",
                    rowClassName?.(row.original as T)
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original as T) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row.original as T);
                          }
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const column = columns[cell.column.getIndex()];
                    const align = column?.align ?? "start";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(ALIGN_CLASS[align], column?.className)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && !error ? (
        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          disabled={pagination.disabled}
          labels={{
            summary: pagination.summary,
            previous: t("table.previous"),
            next: t("table.next"),
          }}
        />
      ) : null}
    </div>
  );
}
