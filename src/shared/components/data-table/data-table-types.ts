import type { ReactNode } from "react";

/** Column alignment — logical values so the table mirrors in RTL. */
export type DataTableAlign = "start" | "center" | "end";

/** Alignment → logical text utility (RTL-safe by construction). */
export const ALIGN_CLASS = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;

export type DataTableColumn<T> = {
  /** Unique column id (stable across renders). */
  key: string;
  /** Already-translated header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Enables client sorting on this column. See the sorting caveat in data-table.tsx. */
  sortValue?: (row: T) => string | number;
  /** Initial sort direction when the column is the first sorted one. */
  sortDescFirst?: boolean;
  align?: DataTableAlign;
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
