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
import type { ApiError } from "@/shared/api/http-client";
import { useT } from "@/shared/i18n";
import { useUpdateUser } from "../hooks/use-admin";
import { apiMessage } from "../utils/api-error";
import { updateUserSchema, type UpdateUserFormValues } from "../validations/user-schema";

/** Edit-profile dialog launched from UserDetailDialog. */
export function EditProfileDialog({
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
  const formId = useId();
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
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("admin.users.editTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("admin.users.editTitle")}</DialogDescription>
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
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("profile.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={update.isPending}>
            {t("profile.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
