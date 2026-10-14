"use client";

import { useMemo } from "react";
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
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { MatrixRow } from "./MatrixRow";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { usePermissionMatrix } from "../hooks/use-admin";
import { groupColumns, matrixColumns, matrixRows } from "../utils/matrix";
import { actionLabelKey, functionLabelKey } from "../utils/matrix-labels";

export function PermissionsTab() {
  const t = useT();
  const { data, isPending, isError, refetch } = usePermissionMatrix();

  const columns = useMemo(() => matrixColumns(data ?? []), [data]);
  const groups = useMemo(() => groupColumns(columns), [columns]);
  const rows = matrixRows(data ?? []);
  // Column indexes that start a function group (never the sticky role column).
  const groupSpans = groups
    .map((g) => columns.indexOf(g.permissions[0]))
    .filter((index) => index > 0);
  const sizeLabel = data
    ? t("admin.matrix.size", { roles: data.length, perms: columns.length })
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <AdminSurfaceHeader labelKey="admin.tabPermissions" count={sizeLabel} />

      <p className="text-xs text-muted-foreground">{t("admin.matrix.legend")}</p>
      <p className="text-xs text-muted-foreground md:hidden">{t("admin.matrix.scrollHint")}</p>

      {isPending ? (
        <SkeletonRows count={6} className="h-12 w-full rounded-lg" />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} className="rounded-lg border bg-card p-6" />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-max">
            <TableHeader className="sticky top-0 z-20">
              {/* Group row: one cell per contiguous function group. */}
              <TableRow className="hover:bg-transparent">
                <TableHead
                  rowSpan={2}
                  className="sticky start-0 z-30 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white"
                  scope="col"
                >
                  {t("admin.users.role")}
                </TableHead>
                {groups.map((group) => (
                  <TableHead
                    key={group.func}
                    colSpan={group.permissions.length}
                    className="border-s border-white/20 bg-[var(--navy-shell)] px-2 text-center text-xs font-bold text-white"
                    scope="colgroup"
                  >
                    {t(functionLabelKey(group.func))}
                  </TableHead>
                ))}
                <TableHead
                  rowSpan={2}
                  className="sticky end-0 z-30 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white"
                  scope="col"
                >
                  {t("profile.save")}
                </TableHead>
              </TableRow>
              {/* Action row: one short label per permission column. */}
              <TableRow className="hover:bg-transparent">
                {columns.map((permission, index) => {
                  const actionKey = actionLabelKey(permission);
                  return (
                    <TableHead
                      key={permission}
                      className={cn(
                        "h-9 bg-[var(--navy-shell)] px-2 text-center text-[0.7rem] font-medium text-white/85",
                        index > 0 && groups.find((g) => g.permissions[0] === permission) &&
                          "border-s border-white/20"
                      )}
                      title={permission}
                      scope="col"
                    >
                      {actionKey ? t(actionKey) : permission.split(":")[1]}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + 2} className="p-6 text-center text-sm">
                    {t("admin.users.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <MatrixRow key={row.role} row={row} columns={columns} groupSpans={groupSpans} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
