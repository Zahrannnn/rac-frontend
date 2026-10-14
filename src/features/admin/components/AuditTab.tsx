"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { AuditDetailDialog } from "./AuditDetailDialog";
import { AuditFiltersPanel } from "./AuditFiltersPanel";
import { useAuditLogs } from "../hooks/use-admin";
import { type AuditAction, type AuditFilters, type AuditLogEntry } from "../types";
import { auditFiltersToQuery, parseAuditFilters } from "../utils/audit-filters";
import { parseChanges, summarizeChanges } from "../utils/audit-changes";

function ActionBadge({ action }: { action: AuditAction }) {
  const t = useT();

  const styles: Record<AuditAction, string> = {
    Added: "bg-[var(--success)]/15 text-[var(--success)]",
    Modified: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    Deleted: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        styles[action]
      )}
    >
      {t(`audit.${action}` as const)}
    </span>
  );
}

export function AuditTab() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoized so unrelated re-renders don't churn the filter panel's drafts.
  const filters = useMemo(
    () => parseAuditFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const onFiltersChange = useCallback(
    (next: AuditFilters) => {
      const query = auditFiltersToQuery(next);
      router.replace(query ? `?${query.slice(1)}` : "?");
    },
    [router]
  );

  const { data, isPending, isPlaceholderData, isError, refetch } = useAuditLogs(filters);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  // Chronological server order (older/newer paging) — no client sortValue.
  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "at",
      header: t("admin.audit.at"),
      headerClassName: "w-40",
      className: "text-sm tabular-nums",
      cell: (entry) => <span dir="ltr">{formatDateTimeUtc(entry.atUtc)}</span>,
    },
    {
      key: "user",
      header: t("admin.audit.user"),
      headerClassName: "w-32",
      cell: (entry) => (
        <span className="block truncate font-mono text-xs font-semibold text-[var(--navy)]">
          {entry.username ?? "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: t("admin.audit.action"),
      headerClassName: "w-24",
      cell: (entry) => <ActionBadge action={entry.action} />,
    },
    {
      key: "entity",
      header: t("admin.audit.entity"),
      headerClassName: "w-40",
      cell: (entry) => (
        <>
          <span className="block truncate text-sm font-medium">{entry.entityName}</span>
          <span
            className="block truncate font-mono text-[0.65rem] text-muted-foreground"
            dir="ltr"
          >
            {entry.entityId}
          </span>
        </>
      ),
    },
    {
      key: "changes",
      header: t("admin.audit.changes"),
      cell: (entry) => (
        <span className="block truncate font-mono text-xs text-muted-foreground">
          {summarizeChanges(parseChanges(entry.action, entry.changes))}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <AdminSurfaceHeader
        labelKey="admin.tabAudit"
        count={data ? t("admin.audit.totalCount", { count: data.totalCount }) : undefined}
      />

      <AuditFiltersPanel filters={filters} onFiltersChange={onFiltersChange} />

      <DataTable
        className={cn(isPlaceholderData && "opacity-60")}
        columns={columns}
        data={data?.items}
        getRowId={(entry) => entry.id}
        ariaLabel={t("admin.tabAudit")}
        onRowClick={setDetail}
        isLoading={isPending}
        error={isError}
        onRetry={() => refetch()}
        emptyState={{ title: t("admin.audit.empty") }}
        pagination={
          data
            ? {
                page: filters.page,
                totalPages,
                onPageChange: (page) => onFiltersChange({ ...filters, page }),
                summary: `${t("admin.audit.totalCount", { count: data.totalCount })} · ${t(
                  "workshops.pageOf",
                  { page: data.page, total: totalPages }
                )}`,
                disabled: isPlaceholderData,
              }
            : undefined
        }
      />

      <AuditDetailDialog entry={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  );
}
