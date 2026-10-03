"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { FormField } from "@/shared/components/form/form-field";
import { LocationMapLazy } from "@/shared/components/map";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useI18n, useT } from "@/shared/i18n";
import { WORKSHOP_TYPES } from "../constants/wizard-steps";
import {
  parseEditFormSubmission,
  toEditFormValues,
  toUpdatePayload,
} from "../utils/workshop-form";
import type { EditWorkshopValues } from "../validations/workshop-schema";
import { OTHER_DISTRICT } from "@/shared/constants/districts";
import { DistrictSelect, initDistrictChoice } from "./district-select";
import { useUpdateWorkshop } from "../hooks/use-workshops";
import type { Workshop, WorkshopType } from "../types";

/**
 * Edit form for a single workshop — the body of the former Edit Workshop
 * dialog, now mounted by the dedicated /workshops/[id]/edit page. Seeded once
 * from the loaded workshop; saving keeps the backend 409 duplicate-retry flow
 * (first attempt surfaces the warning, the retry carries ConfirmDuplicate).
 */
export function WorkshopEditForm({
  workshop,
  onSaved,
  onCancel,
}: {
  workshop: Workshop;
  /** Called after a successful save (success toast already shown). */
  onSaved: () => void;
  /** Called when the user abandons the edit. */
  onCancel: () => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const update = useUpdateWorkshop(workshop.id);
  const [values, setValues] = useState<EditWorkshopValues>(() => toEditFormValues(workshop));
  // Legacy free-text districts pre-select Other with the stored text preserved.
  const [districtOther, setDistrictOther] = useState(() =>
    initDistrictChoice(workshop.governorate, workshop.district).other
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  // The backend 409s edits that match other workshops unless ConfirmDuplicate
  // is set — first attempt surfaces the warning, the retry carries the flag.
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const geolocation = useGeolocationCapture();
  const gpsState = geolocation.status;

  function patch(next: Partial<EditWorkshopValues>) {
    setValues((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const cleared = { ...prev };
      for (const key of Object.keys(next)) {
        delete cleared[key];
      }
      return cleared;
    });
  }

  function captureGps() {
    geolocation.capture({
      onPosition: (latitude, longitude) => patch({ latitude, longitude }),
    });
  }

  function save(confirmDuplicate: boolean) {
    const submission = parseEditFormSubmission(values, districtOther, t);
    if ("errors" in submission) {
      setErrors(submission.errors);
      return;
    }

    update.mutate(toUpdatePayload(submission.data, confirmDuplicate), {
      onSuccess: () => {
        toast.success(t("profile.saved"));
        onSaved();
      },
      onError: (error) => {
        if ((error as { status?: number }).status === 409) {
          if (!confirmDuplicate) {
            setDuplicateWarning(true);
          } else {
            toast.warning(t("duplicate.conflict"));
          }
        } else if ((error as { status?: number }).status !== 403) {
          toast.error(`${t("common.error")} — ${t("common.retry")}`);
        }
      },
    });
  }

  const hasCoords = values.latitude !== null && values.longitude !== null;

  return (
    <section className="rounded-lg border bg-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("wizard.nameEn")} error={errors.nameEn}>
          <Input
            value={values.nameEn}
            onChange={(event) => patch({ nameEn: event.target.value })}
          />
        </FormField>
        <FormField label={t("wizard.nameAr")}>
          <Input
            value={values.nameAr ?? ""}
            onChange={(event) => patch({ nameAr: event.target.value })}
          />
        </FormField>
        <FormField label={t("wizard.ownerName")} error={errors.ownerName}>
          <Input
            value={values.ownerName}
            onChange={(event) => patch({ ownerName: event.target.value })}
          />
        </FormField>
        <FormField label={t("wizard.mobile")} error={errors.mobile}>
          <Input
            value={values.mobile}
            onChange={(event) => patch({ mobile: event.target.value })}
            inputMode="tel"
          />
        </FormField>
        <FormField label={t("wizard.type")}>
          <Select
            value={values.type}
            onValueChange={(value) => patch({ type: value as WorkshopType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKSHOP_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`type.${type}` as const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t("wizard.governorate")}>
          <Select
            value={values.governorate}
            onValueChange={(value) => {
              patch({
                governorate: value as EditWorkshopValues["governorate"],
                district: "",
              });
              setDistrictOther(false);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOVERNORATES.map((governorate) => (
                <SelectItem key={governorate} value={governorate}>
                  {governorateLabel(governorate, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t("wizard.address")} error={errors.address} className="sm:col-span-2">
          <Input
            value={values.address}
            onChange={(event) => patch({ address: event.target.value })}
          />
        </FormField>
        <FormField label={t("wizard.district")} error={errors.district}>
          <DistrictSelect
            governorate={values.governorate}
            value={districtOther ? OTHER_DISTRICT : values.district ?? ""}
            onPick={(value) => {
              if (value === OTHER_DISTRICT) {
                setDistrictOther(true);
                patch({ district: "" });
              } else {
                setDistrictOther(false);
                patch({ district: value });
              }
            }}
          />
          {districtOther ? (
            <Input
              className="mt-2"
              value={values.district ?? ""}
              onChange={(event) => patch({ district: event.target.value })}
              placeholder={t("wizard.districtManualPlaceholder")}
              aria-invalid={Boolean(errors.district)}
            />
          ) : null}
        </FormField>
        <FormField label={t("wizard.telephone")}>
          <Input
            value={values.telephone ?? ""}
            onChange={(event) => patch({ telephone: event.target.value })}
          />
        </FormField>
        <FormField label={t("wizard.numberOfTechnicians")} error={errors.numberOfTechnicians}>
          <Input
            type="number"
            min={0}
            max={1000}
            value={values.numberOfTechnicians ?? ""}
            onChange={(event) =>
              patch({
                numberOfTechnicians:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
          />
        </FormField>
        <FormField label={t("wizard.activities")}>
          <Input
            value={values.activities ?? ""}
            onChange={(event) => patch({ activities: event.target.value })}
          />
        </FormField>
        <FormField label={t("profile.notes")} className="sm:col-span-2">
          <Input
            value={values.notes ?? ""}
            onChange={(event) => patch({ notes: event.target.value })}
          />
        </FormField>

        <div className="sm:col-span-2 rounded-md border bg-[color-mix(in_oklab,var(--brand-blue)_5%,white)] p-4">
          <p className="text-sm font-semibold text-[var(--navy)]">{t("wizard.gps")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("wizard.gpsHint")}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <FormField label={t("wizard.lat")} error={errors.latitude}>
              <Input
                className="w-36 tabular-nums"
                value={values.latitude ?? ""}
                onChange={(event) =>
                  patch({
                    latitude: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                inputMode="decimal"
                dir="ltr"
              />
            </FormField>
            <FormField label={t("wizard.lon")} error={errors.longitude}>
              <Input
                className="w-36 tabular-nums"
                value={values.longitude ?? ""}
                onChange={(event) =>
                  patch({
                    longitude: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                inputMode="decimal"
                dir="ltr"
              />
            </FormField>
            <Button
              type="button"
              variant="secondary"
              onClick={captureGps}
              disabled={gpsState === "capturing" || update.isPending}
            >
              <MapPin data-icon="inline-start" />
              {gpsState === "capturing" ? t("wizard.capturingGps") : t("wizard.captureGps")}
            </Button>
            {gpsState === "captured" && hasCoords ? (
              <span className="text-sm font-medium text-[var(--success)]">
                {t("wizard.gpsCaptured")}
              </span>
            ) : null}
          </div>
          {hasCoords ? (
            <div className="mt-3">
              <LocationMapLazy
                lat={values.latitude!}
                lon={values.longitude!}
                editable
                onChange={(newLat, newLon) =>
                  patch({ latitude: newLat, longitude: newLon })
                }
                height={220}
              />
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {t("map.noCoordinatesHint")}
            </p>
          )}
        </div>
      </div>

      {duplicateWarning ? (
        <p className="mt-3 rounded-md bg-[var(--warning)]/10 p-3 text-sm text-[#8a5a14]">
          {t("duplicate.conflictRetry")}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("profile.cancel")}
        </Button>
        <Button
          type="button"
          disabled={update.isPending}
          onClick={() => save(duplicateWarning)}
        >
          {update.isPending
            ? t("profile.saving")
            : duplicateWarning
              ? t("duplicate.continueNew")
              : t("profile.save")}
        </Button>
      </div>
    </section>
  );
}
