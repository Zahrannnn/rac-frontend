"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useT } from "@/shared/i18n";
import { useUpdateWorkshop } from "../hooks/use-workshops";
import {
  parseEditFormSubmission,
  toEditFormValues,
  toUpdatePayload,
} from "../utils/workshop-form";
import type { EditWorkshopValues } from "../validations/workshop-schema";
import type { Workshop } from "../types";
import { initDistrictChoice } from "./district-select";
import { GpsCaptureFields } from "./GpsCaptureFields";
import { WorkshopEditFields } from "./WorkshopEditFields";

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
        <WorkshopEditFields
          values={values}
          errors={errors}
          districtOther={districtOther}
          onDistrictOtherChange={setDistrictOther}
          onPatch={patch}
        />

        <GpsCaptureFields
          className="sm:col-span-2"
          latitude={values.latitude}
          longitude={values.longitude}
          onPatch={patch}
          gpsState={gpsState}
          onCapture={captureGps}
          captureDisabled={update.isPending}
          showCaptured={gpsState === "captured" && hasCoords}
          latitudeError={errors.latitude}
          longitudeError={errors.longitude}
          mapHeight={220}
        />
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
