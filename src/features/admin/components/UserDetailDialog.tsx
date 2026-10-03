"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Pencil, Shield, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/shared/api/http-client";
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>{t("admin.users.detailTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.users.detailTitle")}</DialogDescription>

          {isPending ? (
            <div className="flex flex-col gap-2" aria-busy>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>{t("common.error")}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--navy)]">{data.fullName}</p>
                  <p className="font-mono text-sm text-muted-foreground" dir="ltr">
                    {data.username}
                  </p>
                </div>
                <RoleBadge role={data.role} />
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t("admin.users.email")}</dt>
                  <dd dir="ltr">{data.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("admin.users.phone")}</dt>
                  <dd dir="ltr">{data.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("admin.users.status")}</dt>
                  <dd>
                    {t(data.isActive ? "admin.users.active" : "admin.users.inactive")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("admin.users.lastLogin")}</dt>
                  <dd dir="ltr">
                    {data.lastLoginAtUtc ? formatDateTimeUtc(data.lastLoginAtUtc) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("admin.users.createdAt")}</dt>
                  <dd dir="ltr">{formatDateTimeUtc(data.createdAtUtc)}</dd>
                </div>
                {data.role === "FieldTeams" ? (
                  <div>
                    <dt className="text-muted-foreground">{t("admin.users.assignments")}</dt>
                    <dd>{data.assignedWorkshopCount ?? 0}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil data-icon="inline-start" />
                  {t("admin.users.edit")}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setRoleOpen(true)}>
                  <Shield data-icon="inline-start" />
                  {t("admin.users.changeRole")}
                </Button>
                <Button
                  type="button"
                  size="sm"
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
                <Button type="button" size="sm" variant="outline" onClick={() => setResetOpen(true)}>
                  <KeyRound data-icon="inline-start" />
                  {t("admin.users.resetPassword")}
                </Button>
              </div>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-[var(--navy)]">
                  {t("admin.users.recentActivity")}
                </h3>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("admin.users.noActivity")}</p>
                ) : (
                  <ul className="max-h-48 overflow-y-auto rounded-md border divide-y">
                    {data.recentActivity.map((item, index) => (
                      <li
                        key={`${item.occurredAtUtc}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                      >
                        <span>
                          <span className="font-semibold">{item.action}</span>
                          {" · "}
                          <span className="text-muted-foreground">{item.entity}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground" dir="ltr">
                          {formatDateTimeUtc(item.occurredAtUtc)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
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
