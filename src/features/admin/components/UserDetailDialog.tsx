"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Pencil, Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/shared/api/http-client";
import { DetailItem, DetailList } from "@/shared/components/detail-list";
import { useT } from "@/shared/i18n";
import { formatDateTimeUtc } from "@/shared/utils/datetime";
import { usePatchUserStatus, useUser } from "../hooks/use-admin";
import { apiMessage } from "../utils/api-error";
import { RoleBadge } from "./RoleBadge";
import {
  ChangeRoleDialog,
  EditProfileDialog,
  ResetPasswordDialog,
} from "./UserDetailActionDialogs";

export function UserDetailDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { data, isPending, isError, refetch } = useUser(open ? userId : null);
  const patchStatus = usePatchUserStatus(userId ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const toggleStatus = () => {
    if (!data) return;
    patchStatus.mutate(
      { isActive: !data.isActive },
      {
        onSuccess: () => {
          toast.success(
            t(data.isActive ? "admin.users.deactivated" : "admin.users.activated")
          );
          void refetch();
        },
        onError: (error) => {
          const status = (error as ApiError).status;
          if (status === 400) {
            toast.error(apiMessage(error) ?? t("admin.users.cannotDeactivateSelf"));
          } else if (status === 409) {
            toast.error(apiMessage(error) ?? t("admin.users.lastSuperAdmin"));
          } else {
            toast.error(apiMessage(error) ?? t("common.error"));
          }
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{t("admin.users.detailTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{t("admin.users.detailTitle")}</DialogDescription>
          </DialogHeader>

          <DialogBody>
            {isPending ? (
              <div className="flex flex-col gap-3" aria-busy>
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : isError || !data ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                <p>{t("common.error")}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-base font-semibold text-foreground">{data.fullName}</p>
                    <p className="font-mono text-sm text-muted-foreground" dir="ltr">
                      {data.username}
                    </p>
                  </div>
                  <RoleBadge role={data.role} />
                </div>

                <DetailList className="border-t pt-5">
                  <DetailItem label={t("admin.users.email")}>
                    <span dir="ltr">{data.email}</span>
                  </DetailItem>
                  <DetailItem label={t("admin.users.phone")}>
                    <span dir="ltr" className="tabular-nums">{data.phone ?? "—"}</span>
                  </DetailItem>
                  <DetailItem label={t("admin.users.status")}>
                    {t(data.isActive ? "admin.users.active" : "admin.users.inactive")}
                  </DetailItem>
                  <DetailItem label={t("admin.users.lastLogin")}>
                    <span dir="ltr" className="tabular-nums">
                      {data.lastLoginAtUtc ? formatDateTimeUtc(data.lastLoginAtUtc) : "—"}
                    </span>
                  </DetailItem>
                  <DetailItem label={t("admin.users.createdAt")}>
                    <span dir="ltr" className="tabular-nums">
                      {formatDateTimeUtc(data.createdAtUtc)}
                    </span>
                  </DetailItem>
                  {data.role === "FieldTeams" ? (
                    <DetailItem label={t("admin.users.assignments")}>
                      <span className="tabular-nums">{data.assignedWorkshopCount ?? 0}</span>
                    </DetailItem>
                  ) : null}
                </DetailList>

                <DialogSection title={t("admin.users.recentActivity")} className="border-t pt-5">
                  {data.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("admin.users.noActivity")}</p>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {data.recentActivity.map((item, index) => (
                        <li
                          key={`${item.occurredAtUtc}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                        >
                          <span>
                            <span className="font-semibold">{item.action}</span>
                            {" · "}
                            <span className="text-muted-foreground">{item.entity}</span>
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground" dir="ltr">
                            {formatDateTimeUtc(item.occurredAtUtc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DialogSection>
              </>
            )}
          </DialogBody>

          {data && !isPending && !isError ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil data-icon="inline-start" />
                {t("admin.users.edit")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setRoleOpen(true)}>
                <Shield data-icon="inline-start" />
                {t("admin.users.changeRole")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={patchStatus.isPending}
                onClick={toggleStatus}
              >
                {data.isActive ? (
                  <UserX data-icon="inline-start" />
                ) : (
                  <UserCheck data-icon="inline-start" />
                )}
                {t(data.isActive ? "admin.users.deactivate" : "admin.users.activate")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
                <KeyRound data-icon="inline-start" />
                {t("admin.users.resetPassword")}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      {data ? (
        <>
          <EditProfileDialog
            userId={data.id}
            initial={{
              fullName: data.fullName,
              email: data.email,
              phone: data.phone ?? "",
            }}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ChangeRoleDialog
            userId={data.id}
            currentRole={data.role}
            open={roleOpen}
            onOpenChange={setRoleOpen}
          />
          <ResetPasswordDialog
            userId={data.id}
            open={resetOpen}
            onOpenChange={setResetOpen}
          />
        </>
      ) : null}
    </>
  );
}
