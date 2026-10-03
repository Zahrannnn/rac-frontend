"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { AdminSurfaceHeader } from "./AdminSurfaceHeader";
import { QueryErrorState, SkeletonRows } from "@/shared/components/query-states";
import { usePermissionMatrix, useSaveRolePermissions } from "../hooks/use-admin";
import { groupColumns, matrixColumns, matrixRows, rowPayload, togglePermission } from "../utils/matrix";
import { actionLabelKey, functionLabelKey } from "../utils/matrix-labels";
import type { RolePermissionsRow } from "../types";

function MatrixRow({
  row,
  columns,
  groupSpans,
}: {
  row: RolePermissionsRow;
  columns: string[];
  /** Spans of the contiguous function groups — group boundary cells get a divider. */
  groupSpans: number[];
}) {
  const t = useT();
  const [draft, setDraft] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const save = useSaveRolePermissions();

  const granted = draft ?? row.permissions;
  const dirty =
    draft !== null &&
    (draft.length !== row.permissions.length ||
      draft.some((permission, index) => row.permissions[index] !== permission));

  const toggle = (permission: string) => setDraft(togglePermission(granted, permission));

  const confirmSave = () => {
    save.mutate(
      { role: row.role, permissions: rowPayload(granted) },
      {
        onSuccess: () => {
          setDraft(null);
          setConfirming(false);
          toast.success(t("admin.matrix.saved"));
        },
        onError: () => toast.error(t("common.error")),
      }
    );
  };

  return (
    <>
      <TableRow className="h-12 hover:bg-[var(--row-selected)]/60">
        <TableCell className="sticky start-0 z-10 bg-card font-semibold text-[var(--navy)]">
          {t(`role.${row.role}` as Parameters<typeof t>[0])}
        </TableCell>
        {columns.map((permission, index) => {
          const checked = granted.includes(permission);
          const startsGroup = groupSpans.includes(index);
          return (
            <TableCell
              key={permission}
              className={cn("text-center", index > 0 && startsGroup && "border-s")}
            >
              <Checkbox
                aria-label={`${row.role}: ${permission} — ${
                  checked ? t("admin.matrix.granted") : t("admin.matrix.denied")
                }`}
                checked={checked}
                onCheckedChange={() => toggle(permission)}
              />
            </TableCell>
          );
        })}
        <TableCell className="sticky end-0 z-10 bg-card text-end">
          {dirty ? (
            <span className="inline-flex flex-col items-end gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => setConfirming(true)}
                disabled={save.isPending}
              >
                <Save data-icon="inline-start" />
                {t("admin.matrix.saveRow")}
              </Button>
              <span className="text-[0.65rem] font-semibold text-[var(--secondary)]">
                {t("admin.matrix.dirty")}
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{t("admin.matrix.confirmTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("admin.matrix.confirmTitle")}
          </DialogDescription>
          <p className="rounded-md bg-[var(--warning)]/15 p-3 text-sm font-medium text-[#8a5a14]">
            {t("admin.matrix.confirmMessage")}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              {t("profile.cancel")}
            </Button>
            <Button type="button" onClick={confirmSave} disabled={save.isPending}>
              {t("admin.matrix.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
