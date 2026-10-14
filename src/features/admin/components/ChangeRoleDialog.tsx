"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/shared/components/form/form-field";
import type { ApiError } from "@/shared/api/http-client";
import { useT } from "@/shared/i18n";
import { useChangeUserRole } from "../hooks/use-admin";
import { USER_ROLES, type UserRole } from "../types";
import { apiMessage } from "../utils/api-error";

/** Change-role dialog launched from UserDetailDialog. */
export function ChangeRoleDialog({
  userId,
  currentRole,
  open,
  onOpenChange,
}: {
  userId: string;
  currentRole: UserRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const changeRole = useChangeUserRole(userId);
  const [role, setRole] = useState<UserRole>(currentRole);
  const [confirm, setConfirm] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Re-derive the draft whenever the dialog opens so a role change to the
  // underlying user is reflected on reopen.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setRole(currentRole);
      setConfirm(false);
    }
  }

  const submit = () => {
    if (!confirm) {
      toast.error(t("admin.users.roleConfirmRequired"));
      return;
    }
    changeRole.mutate(
      { role, confirm: true },
      {
        onSuccess: () => {
          toast.success(t("admin.users.roleChanged"));
          onOpenChange(false);
        },
        onError: (error) => {
          const status = (error as ApiError).status;
          if (status === 400) {
            toast.error(apiMessage(error) ?? t("admin.users.cannotChangeOwnRole"));
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("admin.users.changeRoleTitle")}</DialogTitle>
          <DialogDescription>{t("admin.users.changeRoleHint")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-5">
          <FormField label={t("admin.users.role")} required>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`role.${item}` as const)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex items-start gap-3 rounded-md bg-muted/60 px-3 py-3">
            <Checkbox
              id="role-confirm"
              checked={confirm}
              onCheckedChange={(checked) => setConfirm(checked === true)}
            />
            <Label htmlFor="role-confirm" className="text-sm font-medium leading-6">
              {t("admin.users.roleConfirmLabel")}
            </Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("profile.cancel")}
          </Button>
          <Button type="button" disabled={changeRole.isPending || !confirm} onClick={submit}>
            {t("admin.users.changeRole")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
