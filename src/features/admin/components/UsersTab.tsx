"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { CreateUserDialog } from "./CreateUserDialog";
import { RoleBadge } from "./RoleBadge";
import { UserDetailDialog } from "./UserDetailDialog";
import { useUsers } from "../hooks/use-admin";
import type { AdminUser, UserListFilters } from "../types";

export function UsersTab() {
  const t = useT();
  const [filters, setFilters] = useState<UserListFilters>({ page: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isPlaceholderData, isError, refetch } = useUsers(filters);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;

  // Server-paged registry in API order — no client sortValue.
  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "username",
      header: t("admin.users.username"),
      className: "font-mono text-sm font-semibold text-[var(--navy)]",
      cell: (user) => user.username,
    },
    {
      key: "fullName",
      header: t("admin.users.fullName"),
      className: "text-sm",
      cell: (user) => user.fullName,
    },
    {
      key: "email",
      header: t("admin.users.email"),
      headerClassName: "w-[14rem]",
      className: "text-sm text-muted-foreground",
      cell: (user) => (
        <span dir="ltr" className="block truncate">
          {user.email}
        </span>
      ),
    },
    {
      key: "role",
      header: t("admin.users.role"),
      headerClassName: "w-[9rem]",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
        </div>
      ),
    },
    {
      key: "status",
      header: t("admin.users.status"),
      headerClassName: "w-[8rem]",
      cell: (user) => (
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
      ),
    },
  ];

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

      <DataTable
        className={cn(isPlaceholderData && "opacity-60")}
        columns={columns}
        data={data?.items}
        getRowId={(user) => user.id}
        ariaLabel={t("admin.tabUsers")}
        onRowClick={(user) => setDetailId(user.id)}
        isLoading={isPending}
        error={isError}
        onRetry={() => refetch()}
        emptyState={{ title: t("admin.users.empty") }}
        pagination={
          data
            ? {
                page: filters.page,
                totalPages,
                onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
                summary: `${t("admin.users.totalCount", { count: data.totalCount })} · ${t(
                  "workshops.pageOf",
                  { page: data.page, total: totalPages }
                )}`,
                disabled: isPlaceholderData,
              }
            : undefined
        }
      />

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
