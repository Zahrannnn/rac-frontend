"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import { useT } from "@/shared/i18n";
import { useResetUserPassword } from "../hooks/use-admin";
import { apiMessage } from "../utils/api-error";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../validations/user-schema";

/** Reset-password dialog launched from UserDetailDialog. */
export function ResetPasswordDialog({
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
  const formId = useId();
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
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("admin.users.resetPasswordTitle")}</DialogTitle>
          <DialogDescription>{t("admin.users.resetPasswordHint")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
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
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("profile.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={reset.isPending}>
            {t("admin.users.resetPassword")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
