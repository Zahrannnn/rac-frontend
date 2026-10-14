"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useSaveRolePermissions } from "../hooks/use-admin";
import { rowPayload, togglePermission } from "../utils/matrix";
import type { RolePermissionsRow } from "../types";

/**
 * One role's editable matrix row: local draft of granted permissions, a dirty
 * flag, and a confirm dialog before saving — the save button lives in the
 * sticky end column of the row.
 */
export function MatrixRow({
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
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("admin.matrix.confirmTitle")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("admin.matrix.confirmTitle")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="rounded-md bg-[var(--warning)]/15 px-4 py-3 text-sm font-medium leading-6 text-[#8a5a14] dark:text-[var(--warning)]">
              {t("admin.matrix.confirmMessage")}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {t("profile.cancel")}
            </Button>
            <Button type="button" onClick={confirmSave} disabled={save.isPending}>
              {t("admin.matrix.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
