"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/shared/components/form/form-field";
import { useT } from "@/shared/i18n";
import { useCreateUser } from "../hooks/use-admin";
import { USER_ROLES, type UserRole } from "../types";
import { createUserSchema, USER_FIELD_MESSAGES, type CreateUserFormValues } from "../validations/user-schema";

/** Create-user form dialog; opened from the UsersTab header. */
export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const create = useCreateUser();
  const formId = useId();
  const [values, setValues] = useState<CreateUserFormValues>({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "FieldTeams",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormValues, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const patch = (next: Partial<CreateUserFormValues>) => {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const cleared = { ...prev };
      for (const key of Object.keys(next)) {
        delete cleared[key as keyof CreateUserFormValues];
      }
      return cleared;
    });
  };

  const submit = () => {
    setSubmitted(true);
    const parsed = createUserSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CreateUserFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CreateUserFormValues;
        fieldErrors[field] = t(USER_FIELD_MESSAGES[field] as Parameters<typeof t>[0]);
      }
      setErrors(fieldErrors);
      return;
    }

    create.mutate(
      {
        ...parsed.data,
        phone: parsed.data.phone || null,
      },
      {
        onSuccess: () => {
          toast.success(t("admin.users.created"));
          onOpenChange(false);
          setValues({
            username: "",
            email: "",
            fullName: "",
            password: "",
            role: "FieldTeams",
            phone: "",
          });
          setSubmitted(false);
        },
        onError: (error) => {
          if ((error as { status?: number }).status === 409) {
            toast.error(t("admin.users.duplicate"));
          } else {
            toast.error(t("common.error"));
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("admin.users.createTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("admin.users.createTitle")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form
            id={formId}
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <FormField label={t("admin.users.username")} required error={submitted ? errors.username : undefined}>
              <Input
                dir="ltr"
                value={values.username}
                onChange={(event) => patch({ username: event.target.value })}
                maxLength={64}
                aria-invalid={Boolean(submitted && errors.username)}
              />
            </FormField>

            <FormField label={t("admin.users.fullName")} required error={submitted ? errors.fullName : undefined}>
              <Input
                value={values.fullName}
                onChange={(event) => patch({ fullName: event.target.value })}
                maxLength={128}
                aria-invalid={Boolean(submitted && errors.fullName)}
              />
            </FormField>

            <FormField label={t("admin.users.email")} required error={submitted ? errors.email : undefined}>
              <Input
                type="email"
                dir="ltr"
                value={values.email}
                onChange={(event) => patch({ email: event.target.value })}
                maxLength={254}
                aria-invalid={Boolean(submitted && errors.email)}
              />
            </FormField>

            <FormField label={t("admin.users.phone")} hint={t("admin.users.phoneHint")} error={submitted ? errors.phone : undefined}>
              <Input
                dir="ltr"
                value={values.phone ?? ""}
                onChange={(event) => patch({ phone: event.target.value })}
                placeholder="01012345678"
                aria-invalid={Boolean(submitted && errors.phone)}
              />
            </FormField>

            <FormField label={t("admin.users.password")} required error={submitted ? errors.password : undefined}>
              <Input
                type="password"
                dir="ltr"
                value={values.password}
                onChange={(event) => patch({ password: event.target.value })}
                aria-invalid={Boolean(submitted && errors.password)}
              />
            </FormField>

            <FormField label={t("admin.users.role")} required error={submitted ? errors.role : undefined}>
              <Select value={values.role} onValueChange={(value) => patch({ role: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`role.${role}` as const)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("profile.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={create.isPending}>
            <Plus data-icon="inline-start" />
            {t("admin.users.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
