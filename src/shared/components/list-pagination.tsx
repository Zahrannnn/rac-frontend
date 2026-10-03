"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  /** Called with the next page number. */
  onPageChange: (page: number) => void;
  /** Disables both buttons while a fetch is settling. */
  disabled?: boolean;
  labels: {
    summary: string;
    previous: string;
    next: string;
  };
  className?: string;
};

/**
 * Shared pagination footer for server-paged registries: "N results · page X of Y"
 * plus previous/next buttons. Labels come from the caller's dictionary.
 */
export function ListPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  labels,
  className,
}: ListPaginationProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-sm text-muted-foreground tabular-nums">{labels.summary}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(page - 1)}
        >
          {labels.previous}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
