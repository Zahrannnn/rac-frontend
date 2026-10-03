"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import {
  SPECIALIZATION_OPTIONS,
  SPECIALTY_OTHER_SENTINEL,
} from "../constants/specializations";
import { useCreateTechnician, useUpdateTechnician } from "../hooks/use-technicians";
import { useWorkshopOptions } from "../hooks/use-workshop-options";
import type { TechnicianFormValues } from "../validations/technician-schema";
import {
  isCustomSpecialty,
  parseTechnicianSubmission,
  specialtyFromSelectValue,
  specialtySelectValue,
  toFormValues,
  toTechnicianCreatePayload,
  toTechnicianUpdatePayload,
} from "../utils/technician-form";
import type { Technician, TechnicianStatus } from "../types";

export function TechnicianForm({
  technician,
  lockedWorkshopId,
  lockedWorkshopLabel,
  onDone,
}: {
  technician: Technician | null;
  lockedWorkshopId?: string;
  lockedWorkshopLabel?: string;
  onDone: () => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const canEdit = Boolean(user && can(user.permissions, "technicians:edit"));
  const create = useCreateTechnician();
  const update = useUpdateTechnician(technician?.id ?? "");
  const workshopLocked = Boolean(technician || lockedWorkshopId);
  const { data: workshops } = useWorkshopOptions(!workshopLocked);
  const [values, setValues] = useState<TechnicianFormValues>(() =>
    toFormValues(technician, lockedWorkshopId)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch(next: Partial<TechnicianFormValues>) {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const cleared = { ...prev };
      for (const key of Object.keys(next)) {
        delete cleared[key];
      }
      return cleared;
    });
  }

  function save() {
    const submission = parseTechnicianSubmission(values, t, technician ? "edit" : "create");
    if ("errors" in submission) {
      setErrors(submission.errors);
      return;
    }

    if (technician) {
      // Edit: nationalId + workshopId are immutable per contract (PATCH fields only).
      update.mutate(toTechnicianUpdatePayload(submission.data), {
        onSuccess: () => finishSave(t("profile.saved")),
        onError: reportMutationError,
      });
    } else {
      create.mutate(toTechnicianCreatePayload(submission.data), {
        onSuccess: () => finishSave(t("technicians.created")),
        onError: reportMutationError,
      });
    }
  }

  function finishSave(message: string) {
    toast.success(message);
    onDone();
  }

  function reportMutationError(error: unknown) {
    // 409/404 get specific, actionable messages; 403 stays silent because the
    // UI already hides forbidden actions.
    const status = (error as { status?: number }).status;
    if (status === 409) {
      toast.warning(t("technicians.duplicateNationalId"));
    } else if (status === 404) {
      toast.error(t("error.notFoundToast"));
    } else if (status !== 403) {
      toast.error(`${t("common.error")} — ${t("common.retry")}`);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <FormField label={t("technicians.fullName")} required error={errors.fullName}>
          <Input
            value={values.fullName}
            onChange={(event) => patch({ fullName: event.target.value })}
            autoComplete="name"
          />
        </FormField>
        <FormField label={t("technicians.fullNameAr")} hint={t("wizard.optionalHint")}>
          <Input
            value={values.fullNameAr ?? ""}
            onChange={(event) => patch({ fullNameAr: event.target.value })}
          />
        </FormField>
        <FormField
          label={t("technicians.nationalId")}
          required={!technician}
          error={errors.nationalId}
          hint={
            technician ? t("technicians.nationalIdImmutable") : t("technicians.nationalIdHint")
          }
        >
          <Input
            dir="ltr"
            inputMode="numeric"
            className="tabular-nums"
            value={values.nationalId}
            disabled={Boolean(technician)}
            onChange={(event) =>
              patch({ nationalId: event.target.value.replace(/\D/g, "").slice(0, 14) })
            }
          />
        </FormField>
        <FormField
          label={t("profile.contactMobile")}
          required
          error={errors.mobile}
          hint={t("wizard.mobileHint")}
        >
          <Input
            dir="ltr"
            inputMode="tel"
            className="tabular-nums"
            value={values.mobile}
            placeholder="01XXXXXXXXX"
            onChange={(event) =>
              patch({ mobile: event.target.value.replace(/\D/g, "").slice(0, 11) })
            }
          />
        </FormField>
        <FormField
          label={t("technicians.workshop")}
          required={!workshopLocked}
          error={errors.workshopId}
          className="sm:col-span-2"
          hint={workshopLocked ? t("technicians.workshopImmutable") : undefined}
        >
          {workshopLocked ? (
            <Input
              readOnly
              value={
                lockedWorkshopLabel ??
                technician?.workshopCode ??
                values.workshopId
              }
              className="bg-muted"
            />
          ) : (
            <Select
              value={values.workshopId || undefined}
              onValueChange={(value) => patch({ workshopId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("technicians.pickWorkshop")} />
              </SelectTrigger>
              <SelectContent>
                {(workshops ?? []).map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    {workshop.code} — {workshop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField label={t("technicians.specialty")} hint={t("wizard.optionalHint")}>
          <div className="flex flex-col gap-2">
            <Select
              value={specialtySelectValue(values.specialty)}
              onValueChange={(value) => patch({ specialty: specialtyFromSelectValue(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("technicians.specialtySelect")} />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
                <SelectItem value={SPECIALTY_OTHER_SENTINEL}>
                  {t("technicians.specialtyOther")}
                </SelectItem>
              </SelectContent>
            </Select>
            {isCustomSpecialty(values.specialty) ? (
              <Input
                value={values.specialty}
                onChange={(event) => patch({ specialty: event.target.value })}
                placeholder={t("technicians.specialtyCustom")}
                aria-label={t("technicians.specialtyCustom")}
              />
            ) : null}
          </div>
        </FormField>
        <FormField label={t("technicians.years")} error={errors.yearsOfExperience}>
          <Input
            type="number"
            min={0}
            max={60}
            className="tabular-nums"
            value={values.yearsOfExperience}
            onChange={(event) =>
              patch({
                yearsOfExperience: event.target.value === "" ? "" : Number(event.target.value),
              })
            }
          />
        </FormField>
        {technician && canEdit ? (
          <FormField label={t("technicians.status")} className="sm:col-span-2">
            <Select
              value={technician.status}
              onValueChange={(value) =>
                update.mutate(
                  { status: value as TechnicianStatus },
                  { onSuccess: () => toast.success(t("profile.saved")) }
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{t("technicians.statusActive")}</SelectItem>
                <SelectItem value="Inactive">{t("technicians.statusInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        ) : null}
        <FormField label={t("profile.notes")} className="sm:col-span-2" hint={t("wizard.optionalHint")}>
          <Input
            value={values.notes ?? ""}
            onChange={(event) => patch({ notes: event.target.value })}
          />
        </FormField>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => onDone()}>
          {t("profile.cancel")}
        </Button>
        <Button
          type="button"
          disabled={create.isPending || update.isPending || Boolean(technician && !canEdit)}
          onClick={save}
        >
          {create.isPending || update.isPending ? t("profile.saving") : t("profile.save")}
        </Button>
      </div>
    </div>
  );
}
