"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { ALIGN_CLASS, type DataTableAlign } from "./data-table-types";
import { cn } from "@/shared/utils/cn";

type DataTableHeaderCellProps = {
  /** Already-translated header label. */
  label: string;
  align: DataTableAlign;
  /** Whether the underlying column is sortable. */
  canSort: boolean;
  sorted: false | "asc" | "desc";
  /** Sticky navy header; needs a scroll parent (max-h) to matter. */
  sticky: boolean;
  headerClassName?: string;
  /** TanStack's toggle-sorting handler, passed through unchanged. */
  onToggleSort?: (event: unknown) => void;
};

/**
 * One navy header cell: the accessible `aria-sort` contract and, for sortable
 * columns, a ghost button with direction icons. Presentational by design —
 * data-table.tsx stays the TanStack adapter.
 */
export function DataTableHeaderCell({
  label,
  align,
  canSort,
  sorted,
  sticky,
  headerClassName,
  onToggleSort,
}: DataTableHeaderCellProps) {
  return (
    <TableHead
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
        sticky && "sticky top-0 z-10",
        align !== "start" && ALIGN_CLASS[align],
        headerClassName
      )}
    >
      {canSort ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/70"
          onClick={onToggleSort}
        >
          {label}
          {sorted === "asc" ? (
            <ArrowUp aria-hidden className="size-3.5" />
          ) : sorted === "desc" ? (
            <ArrowDown aria-hidden className="size-3.5" />
          ) : (
            <ChevronsUpDown aria-hidden className="size-3.5 opacity-60" />
          )}
        </Button>
      ) : (
        label
      )}
    </TableHead>
  );
}
