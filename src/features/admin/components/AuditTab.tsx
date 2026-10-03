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
  DialogContent,
  DialogDescription,
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
import { ListPagination } from "@/shared/components/list-pagination";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { EmptyState, TABLE_HEAD_CLASS } from "./query-states";
import { useAuditLogs } from "../hooks/use-admin";
import { AUDIT_ACTIONS, type AuditAction, type AuditFilters, type AuditLogEntry } from "../types";
import { auditFiltersToQuery, parseAuditFilters } from "../utils/audit-filters";
import { parseChanges, summarizeChanges } from "../utils/audit-changes";

/** Navy band shared by the audit-table headers; widths are appended per column. */

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
      <DialogContent className="max-w-lg">
        <DialogTitle>{t("admin.audit.detailTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {entry ? `${entry.entityName} ${entry.action}` : ""}
        </DialogDescription>

        {entry ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {entry.username ?? "—"} · {formatDateTimeUtc(entry.atUtc)}
            </p>
            <div className="max-h-80 overflow-y-auto rounded-md border">
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
          </div>
        ) : null}
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

/** The audit grid — presentation only; row activation is delegated to the tab. */
function AuditTable({
  entries,
  onSelect,
}: {
  entries: AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
}) {
  const t = useT();

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={`${TABLE_HEAD_CLASS} w-40`}>{t("admin.audit.at")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-32`}>{t("admin.audit.user")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-24`}>{t("admin.audit.action")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-40`}>{t("admin.audit.entity")}</TableHead>
          <TableHead className={TABLE_HEAD_CLASS}>{t("admin.audit.changes")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.id}
            tabIndex={0}
            className="h-12 cursor-pointer hover:bg-[var(--row-selected)] focus-visible:bg-[var(--row-selected)]"
            onClick={() => onSelect(entry)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(entry);
              }
            }}
          >
            <TableCell className="text-sm tabular-nums" dir="ltr">
              {formatDateTimeUtc(entry.atUtc)}
            </TableCell>
            <TableCell className="truncate font-mono text-xs font-semibold text-[var(--navy)]">
              {entry.username ?? "—"}
            </TableCell>
            <TableCell>
              <ActionBadge action={entry.action} />
            </TableCell>
            <TableCell>
              <span className="block truncate text-sm font-medium">{entry.entityName}</span>
              <span className="block truncate font-mono text-[0.65rem] text-muted-foreground" dir="ltr">
                {entry.entityId}
              </span>
            </TableCell>
            <TableCell className="truncate font-mono text-xs text-muted-foreground">
              {summarizeChanges(parseChanges(entry.action, entry.changes))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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

  return (
    <div className="flex flex-col gap-4">
      <AdminSurfaceHeader
        labelKey="admin.tabAudit"
        count={data ? t("admin.audit.totalCount", { count: data.totalCount }) : undefined}
      />

      <AuditFiltersPanel filters={filters} onFiltersChange={onFiltersChange} />

      {isPending ? (
        <SkeletonRows count={6} className="h-11 w-full rounded-lg" />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} className="rounded-lg border bg-card p-6" />
      ) : data && data.items.length === 0 ? (
        <EmptyState message={t("admin.audit.empty")} />
      ) : data ? (
        <>
          <div className={cn("overflow-x-auto rounded-lg border bg-card", isPlaceholderData && "opacity-60")}>
            <AuditTable entries={data.items} onSelect={setDetail} />
          </div>

          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => onFiltersChange({ ...filters, page })}
            disabled={isPlaceholderData}
            labels={{
              summary: `${t("admin.audit.totalCount", { count: data.totalCount })} · ${t(
                "workshops.pageOf",
                { page: data.page, total: totalPages }
              )}`,
              previous: t("workshops.prevPage"),
              next: t("workshops.nextPage"),
            }}
          />
        </>
      ) : null}

      <AuditDetailDialog entry={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  );
}
