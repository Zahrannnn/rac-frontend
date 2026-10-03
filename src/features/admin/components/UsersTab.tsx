"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { CreateUserDialog } from "./CreateUserDialog";
import { RoleBadge } from "./RoleBadge";
import { UserDetailDialog } from "./UserDetailDialog";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { EmptyState, TABLE_HEAD_CLASS } from "./query-states";
import { useUsers } from "../hooks/use-admin";
import type { AdminUser, UserListFilters } from "../types";

/** Navy band shared by the user-table headers; widths are appended per column. */

/** The users grid — presentation only; row selection is delegated to the tab. */
function UsersTable({ users, onSelect }: { users: AdminUser[]; onSelect: (id: string) => void }) {
  const t = useT();

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={TABLE_HEAD_CLASS}>{t("admin.users.username")}</TableHead>
          <TableHead className={TABLE_HEAD_CLASS}>{t("admin.users.fullName")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-[14rem]`}>{t("admin.users.email")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-[9rem]`}>{t("admin.users.role")}</TableHead>
          <TableHead className={`${TABLE_HEAD_CLASS} w-[8rem]`}>{t("admin.users.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user.id}
            className="h-12 cursor-pointer hover:bg-[var(--row-selected)]"
            onClick={() => onSelect(user.id)}
          >
            <TableCell className="font-mono text-sm font-semibold text-[var(--navy)]">
              {user.username}
            </TableCell>
            <TableCell className="text-sm">{user.fullName}</TableCell>
            <TableCell className="truncate text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <RoleBadge role={user.role} />
              </div>
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  user.isActive ? "text-[var(--success)]" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    user.isActive ? "bg-[var(--success)]" : "bg-muted-foreground/50"
                  )}
                  aria-hidden
                />
                {t(user.isActive ? "admin.users.active" : "admin.users.inactive")}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function UsersTab() {
  const t = useT();
  const [filters, setFilters] = useState<UserListFilters>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isPlaceholderData, isError, refetch } = useUsers(filters);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  return (
    <div className="flex flex-col gap-4">
      <AdminSurfaceHeader
        labelKey="admin.tabUsers"
        count={data ? t("admin.users.totalCount", { count: data.totalCount }) : undefined}
      >
        <Button
          onClick={() => setCreateOpen(true)}
          className="border border-white bg-white text-[var(--navy)] hover:bg-white/90"
        >
          <Plus data-icon="inline-start" />
          {t("admin.users.add")}
        </Button>
      </AdminSurfaceHeader>

      {isPending ? (
        <SkeletonRows count={5} className="h-12 w-full rounded-lg" />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} className="rounded-lg border bg-card p-6" />
      ) : data && data.items.length === 0 ? (
        <EmptyState message={t("admin.users.empty")} />
      ) : data ? (
        <>
          <div className={cn("overflow-x-auto rounded-lg border bg-card", isPlaceholderData && "opacity-60")}>
            <UsersTable users={data.items} onSelect={setDetailId} />
          </div>

          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            disabled={isPlaceholderData}
            labels={{
              summary: `${t("admin.users.totalCount", { count: data.totalCount })} · ${t(
                "workshops.pageOf",
                { page: data.page, total: totalPages }
              )}`,
              previous: t("workshops.prevPage"),
              next: t("workshops.nextPage"),
            }}
          />
        </>
      ) : null}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UserDetailDialog
        userId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(next) => {
          if (!next) setDetailId(null);
        }}
      />
    </div>
  );
}
