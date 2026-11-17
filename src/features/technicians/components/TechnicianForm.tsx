"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useCreateTechnician, useUpdateTechnician } from "../hooks/use-technicians";
import type { TechnicianFormValues } from "../validations/technician-schema";
import {
  parseTechnicianSubmission,
  toFormValues,
  toTechnicianCreatePayload,
  toTechnicianUpdatePayload,
} from "../utils/technician-form";
import type { Technician, TechnicianStatus } from "../types";
import {
  EMPLOYMENT_LABELS,
  EMPLOYMENT_NATURE_LABELS,
  GENDER_LABELS,
} from "../utils/technician-form";
import {
  EMPLOYMENT_NATURE_KEYS,
  EMPLOYMENT_TYPE_KEYS,
} from "../validations/technician-schema";
import {
  RegistrySelectField,
  SpecialtyField,
  TechnicianStatusField,
  WorkshopField,
} from "./TechnicianFormFields";

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
      // Edit: the workshop link stays immutable per contract (PATCH fields only).
      // The original record drives the registry fields' clear-vs-keep decision
      // (incl. the manual gender — "" clears — and age, omitted = keep).
      update.mutate(toTechnicianUpdatePayload(submission.data, technician), {
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
    if (status === 404) {
      toast.error(t("error.notFoundToast"));
    } else if (status !== 403) {
      toast.error(`${t("common.error")} — ${t("common.retry")}`);
    }
  }

  return (
    <>
      <DialogBody>
        <div className="grid gap-4 sm:grid-cols-2">
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
          {/* 2026-11-17 NatID removal: gender and age are manual data-entry. */}
          <RegistrySelectField
            label={t("technicians.gender")}
            value={values.gender}
            error={errors.gender}
            options={(["male", "female"] as const).map((key) => ({
              value: key,
              label: t(GENDER_LABELS[key]),
            }))}
            onChange={(key) => patch({ gender: key as TechnicianFormValues["gender"] })}
          />
          <FormField label={t("technicians.age")} error={errors.age} hint={t("wizard.optionalHint")}>
            <Input
              type="number"
              min={10}
              max={90}
              dir="ltr"
              className="tabular-nums"
              value={values.age}
              onChange={(event) =>
                patch({ age: event.target.value === "" ? "" : Number(event.target.value) })
              }
            />
          </FormField>
          <FormField
            label={t("profile.contactMobile")}
            error={errors.mobile}
            hint={t("technicians.mobileHint")}
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
          {/* Registry attribute fields (REGISTRY-GAS-SPEC §2 + §11) — placed after the
              identity block. The workshop select IS جهة العمل (§11 correction — no
              separate employer field); address free; the nature select (نوع العمالة)
              precedes the role select (الوظيفة). */}
          <FormField
            label={t("technicians.address")}
            error={errors.address}
            hint={t("wizard.optionalHint")}
          >
            <Input
              value={values.address ?? ""}
              onChange={(event) => patch({ address: event.target.value })}
            />
          </FormField>
          {/* نوع العمالة (§11) precedes الوظيفة (checklist order 8 → 11); the
              modern-refrigerants يوجد/لا يوجد select follows the role select. */}
          <RegistrySelectField
            label={t("technicians.employmentNature")}
            value={values.employmentNature}
            error={errors.employmentNature}
            options={EMPLOYMENT_NATURE_KEYS.map((key) => ({
              value: key,
              label: t(EMPLOYMENT_NATURE_LABELS[key]),
            }))}
            onChange={(key) =>
              patch({ employmentNature: key as TechnicianFormValues["employmentNature"] })
            }
          />
          <RegistrySelectField
            label={t("technicians.employmentType")}
            value={values.employmentType}
            error={errors.employmentType}
            options={EMPLOYMENT_TYPE_KEYS.map((key) => ({
              value: key,
              label: t(EMPLOYMENT_LABELS[key]),
            }))}
            onChange={(key) =>
              patch({ employmentType: key as TechnicianFormValues["employmentType"] })
            }
          />
          <RegistrySelectField
            label={t("technicians.modernExperience")}
            value={values.hasModernRefrigerantExperience}
            options={[
              { value: "yes", label: t("technicians.modernExperienceYes") },
              { value: "no", label: t("technicians.modernExperienceNo") },
            ]}
            onChange={(key) =>
              patch({
                hasModernRefrigerantExperience:
                  key as TechnicianFormValues["hasModernRefrigerantExperience"],
              })
            }
          />
          <WorkshopField
            technician={technician}
            lockedWorkshopId={lockedWorkshopId}
            lockedWorkshopLabel={lockedWorkshopLabel}
            value={values.workshopId}
            error={errors.workshopId}
            onChange={(workshopId) => patch({ workshopId })}
          />
          <SpecialtyField
            value={values.specialty}
            onChange={(specialty) => patch({ specialty })}
          />
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
            <TechnicianStatusField
              technician={technician}
              onStatusChange={(value) =>
                update.mutate(
                  { status: value as TechnicianStatus },
                  { onSuccess: () => toast.success(t("profile.saved")) }
                )
              }
            />
          ) : null}
          <FormField label={t("technicians.notes")} className="sm:col-span-2" hint={t("wizard.optionalHint")}>
            <Input
              value={values.notes ?? ""}
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </FormField>
        </div>
      </DialogBody>

      <DialogFooter>
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
      </DialogFooter>
    </>
  );
}

