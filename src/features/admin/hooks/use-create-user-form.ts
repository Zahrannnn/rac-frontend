"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/shared/i18n";
import { useCreateUser } from "./use-admin";
import { createUserSchema, USER_FIELD_MESSAGES, type CreateUserFormValues } from "../validations/user-schema";

const EMPTY_FORM: CreateUserFormValues = {
  username: "",
  email: "",
  fullName: "",
  password: "",
  role: "FieldTeams",
  phone: "",
};

/**
 * Owns the create-user draft, per-field validation errors, and submission —
 * CreateUserDialog stays focused on rendering the form. Errors clear as soon
 * as their field is edited again; a successful create resets the whole form.
 */
export function useCreateUserForm(onClose: () => void) {
  const t = useT();
  const create = useCreateUser();
  const [values, setValues] = useState<CreateUserFormValues>(EMPTY_FORM);
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
          onClose();
          setValues(EMPTY_FORM);
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

  return { values, errors, submitted, patch, submit, isPending: create.isPending };
}
