"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { useAuditLogs } from "../hooks/use-admin";
import { AUDIT_ACTIONS, type AuditAction, type AuditFilters, type AuditLogEntry } from "../types";
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

function AuditDetailDialog({ entry, onOpenChange }: { entry: AuditLogEntry | null; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const lines = entry ? parseChanges(entry.action, entry.changes) : [];

  return (
    <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{t("admin.audit.detailTitle")}</DialogTitle>
          <DialogDescription>
            {entry ? (
              <>
                <span className="font-medium text-foreground">{entry.entityName}</span>
                {" · "}
                {entry.username ?? "—"}
                {" · "}
                <span className="tabular-nums">{formatDateTimeUtc(entry.atUtc)}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {entry ? (
            <div className="overflow-x-auto rounded-md border text-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 bg-muted/60 text-xs font-semibold uppercase">
                      {t("admin.audit.field")}
                    </TableHead>
                    {entry.action === "Modified" ? (
                      <>
                        <TableHead className="h-9 w-36 bg-muted/60 text-xs font-semibold uppercase">
                          {t("admin.audit.from")}
                        </TableHead>
                        <TableHead className="h-9 w-36 bg-muted/60 text-xs font-semibold uppercase">
                          {t("admin.audit.to")}
                        </TableHead>
                      </>
                    ) : (
                      <TableHead className="h-9 bg-muted/60 text-xs font-semibold uppercase">
                        {t("admin.audit.snapshot")}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.field} className="h-10 align-top">
                      <TableCell className="font-mono text-xs font-semibold">{line.field}</TableCell>
                      {entry.action === "Modified" ? (
                        <>
                          <TableCell className="break-all text-xs text-muted-foreground">
                            {line.from || "—"}
                          </TableCell>
                          <TableCell className="break-all text-xs">{line.to}</TableCell>
                        </>
                      ) : (
                        <TableCell className="break-all text-xs">{line.to}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Owns the free-text drafts and their debounce so AuditTab stays focused on
 * URL state and the query. Drafts re-sync whenever the URL rewrites filters.
 */
function AuditFiltersPanel({
  filters,
  onFiltersChange,
}: {
  filters: AuditFilters;
  onFiltersChange: (next: AuditFilters) => void;
}) {
  const t = useT();
  const [entityDraft, setEntityDraft] = useState(filters.entityName ?? "");
  const [userDraft, setUserDraft] = useState(filters.username ?? "");
  const [prevFilters, setPrevFilters] = useState(filters);

  // Keep drafts in sync when the URL changes the filters (render-time adjustment).
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setEntityDraft(filters.entityName ?? "");
    setUserDraft(filters.username ?? "");
  }

  // Debounced commit of the free-text filters.
  useEffect(() => {
    if (
      (entityDraft.trim() || undefined) === filters.entityName &&
      (userDraft.trim() || undefined) === filters.username
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      onFiltersChange({
        page: 1,
        entityName: entityDraft.trim() || undefined,
        action: filters.action,
        username: userDraft.trim() || undefined,
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [entityDraft, userDraft, filters.entityName, filters.action, filters.username, onFiltersChange]);

  const clearFilters = useCallback(
    () => onFiltersChange({ page: 1 }),
    [onFiltersChange]
  );

  const hasFilters = Boolean(filters.entityName || filters.action || filters.username || filters.page > 1);

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label htmlFor="audit-entity">{t("admin.audit.entity")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="audit-entity"
            value={entityDraft}
            placeholder={t("admin.audit.entityPlaceholder")}
            className="ps-8"
            onChange={(event) => setEntityDraft(event.target.value)}
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-40">
        <Label>{t("admin.audit.action")}</Label>
        <Select
          value={filters.action ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              page: 1,
              action: value === "all" ? undefined : (value as AuditAction),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.audit.allActions")}</SelectItem>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(`audit.${action}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label htmlFor="audit-user">{t("admin.audit.user")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="audit-user"
            value={userDraft}
            placeholder={t("admin.audit.userPlaceholder")}
            className="ps-8"
            onChange={(event) => setUserDraft(event.target.value)}
          />
        </div>
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--secondary)] hover:text-[var(--secondary)]"
          onClick={clearFilters}
        >
          <X data-icon="inline-start" />
          {t("workshops.clearFilters")}
        </Button>
      ) : null}
    </section>
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
