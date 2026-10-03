"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  useChangeUserRole,
  useResetUserPassword,
  useUpdateUser,
} from "../hooks/use-admin";
import { USER_ROLES, type UserRole } from "../types";
import { apiMessage } from "../utils/api-error";
import {
  resetPasswordSchema,
  updateUserSchema,
  type ResetPasswordFormValues,
  type UpdateUserFormValues,
} from "../validations/user-schema";

/**
 * Action dialogs launched from UserDetailDialog (edit profile, change role,
 * reset password). Grouped here so the detail dialog stays focused on
 * displaying the user.
 */

function EditProfileDialog({
  userId,
  initial,
  open,
  onOpenChange,
}: {
  userId: string;
  initial: UpdateUserFormValues;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const update = useUpdateUser(userId);
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Re-derive the draft from props whenever the dialog opens, so stale
  // edits never survive a Cancel or an underlying user change.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setValues(initial);
      setSubmitted(false);
    }
  }

  const submit = () => {
    setSubmitted(true);
    const parsed = updateUserSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(t("common.error"));
      return;
    }
    update.mutate(
      {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
      },
      {
        onSuccess: () => {
          toast.success(t("admin.users.updated"));
          onOpenChange(false);
        },
        onError: (error) => {
          if ((error as ApiError).status === 409) {
            toast.error(t("admin.users.duplicate"));
          } else {
            toast.error(apiMessage(error) ?? t("common.error"));
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("admin.users.editTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("admin.users.editTitle")}</DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <FormField label={t("admin.users.fullName")} required>
            <Input
              value={values.fullName}
              onChange={(event) => setValues((prev) => ({ ...prev, fullName: event.target.value }))}
              maxLength={128}
              aria-invalid={submitted && !values.fullName.trim()}
            />
          </FormField>
          <FormField label={t("admin.users.email")} required>
            <Input
              type="email"
              dir="ltr"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              maxLength={254}
            />
          </FormField>
          <FormField label={t("admin.users.phone")} hint={t("admin.users.phoneHint")}>
            <Input
              dir="ltr"
              value={values.phone ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="01012345678"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("profile.cancel")}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {t("profile.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
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
      <DialogContent className="max-w-md">
        <DialogTitle>{t("admin.users.changeRoleTitle")}</DialogTitle>
        <DialogDescription>{t("admin.users.changeRoleHint")}</DialogDescription>
        <div className="flex flex-col gap-4">
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
          <div className="flex items-start gap-2">
            <Checkbox
              id="role-confirm"
              checked={confirm}
              onCheckedChange={(checked) => setConfirm(checked === true)}
            />
            <Label htmlFor="role-confirm" className="text-sm font-medium leading-5">
              {t("admin.users.roleConfirmLabel")}
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("profile.cancel")}
            </Button>
            <Button type="button" disabled={changeRole.isPending || !confirm} onClick={submit}>
              {t("admin.users.changeRole")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const reset = useResetUserPassword(userId);
  const [values, setValues] = useState<ResetPasswordFormValues>({ newPassword: "" });
  const [prevOpen, setPrevOpen] = useState(open);

  // Clear the draft whenever the dialog closes (and keep it clean on open)
  // so a typed password never lingers after Cancel.
  if (prevOpen !== open) {
    setPrevOpen(open);
    setValues({ newPassword: "" });
  }

  const submit = () => {
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(t("admin.users.passwordInvalid"));
      return;
    }
    reset.mutate(
      { newPassword: parsed.data.newPassword },
      {
        onSuccess: () => {
          toast.success(t("admin.users.passwordReset"));
          onOpenChange(false);
        },
        onError: (error) => toast.error(apiMessage(error) ?? t("common.error")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("admin.users.resetPasswordTitle")}</DialogTitle>
        <DialogDescription>{t("admin.users.resetPasswordHint")}</DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <FormField label={t("admin.users.newPassword")} required>
            <Input
              type="password"
              dir="ltr"
              value={values.newPassword}
              onChange={(event) => setValues({ newPassword: event.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("profile.cancel")}
            </Button>
            <Button type="submit" disabled={reset.isPending}>
              {t("admin.users.resetPassword")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { EditProfileDialog, ChangeRoleDialog, ResetPasswordDialog };
