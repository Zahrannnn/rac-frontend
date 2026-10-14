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
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/shared/api/http-client";
import { useT } from "@/shared/i18n";
import { usePatchUserStatus, useUser } from "../hooks/use-admin";
import { apiMessage } from "../utils/api-error";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { EditProfileDialog } from "./EditProfileDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { UserDetailSummary } from "./UserDetailSummary";

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
              <UserDetailSummary user={data} />
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
