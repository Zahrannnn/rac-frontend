"use client";

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
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import type { AuditLogEntry } from "../types";
import { parseChanges } from "../utils/audit-changes";

export function AuditDetailDialog({ entry, onOpenChange }: { entry: AuditLogEntry | null; onOpenChange: (open: boolean) => void }) {
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
