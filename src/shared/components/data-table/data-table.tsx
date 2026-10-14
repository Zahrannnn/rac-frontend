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
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { ListPagination } from "@/shared/components/list-pagination";
import { DataTableHeaderCell } from "./data-table-header-cell";
import {
  DataTableEmptyRow,
  DataTableErrorRow,
  DataTableSkeletonRows,
} from "./data-table-states";
import {
  ALIGN_CLASS,
  type DataTableColumn,
  type DataTableEmptyState,
  type DataTablePagination,
} from "./data-table-types";

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
 *
 * This file is the composing shell AND the public export: the column contract
 * lives in ./data-table-types, the header cell in ./data-table-header-cell and
 * the body states in ./data-table-states — re-exported below so consumers keep
 * importing from this path.
 */

export type {
  DataTableColumn,
  DataTableEmptyState,
  DataTablePagination,
} from "./data-table-types";

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
                  return (
                    <DataTableHeaderCell
                      key={header.id}
                      label={column?.header ?? ""}
                      align={column?.align ?? "start"}
                      canSort={header.column.getCanSort()}
                      sorted={header.column.getIsSorted()}
                      sticky={stickyHeader}
                      headerClassName={column?.headerClassName}
                      onToggleSort={header.column.getToggleSortingHandler()}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <DataTableSkeletonRows columns={columns} rowCount={loadingRows} />
            ) : error ? (
              <DataTableErrorRow colSpan={columns.length} onRetry={onRetry} />
            ) : (data?.length ?? 0) === 0 ? (
              <DataTableEmptyRow colSpan={columns.length} emptyState={emptyState} />
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
