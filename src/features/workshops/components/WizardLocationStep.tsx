"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/shared/components/form/form-field";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { OTHER_DISTRICT } from "@/shared/constants/districts";
import { useI18n, useT } from "@/shared/i18n";
import { districtReset } from "../utils/workshop-wizard";
import { governorateLabel } from "../utils/format";
import type { WorkshopWizardController } from "../hooks/use-workshop-wizard";
import { DistrictSelect } from "./district-select";
import { GpsCaptureFields } from "./GpsCaptureFields";

/** Step 3 — location: governorate/district/address plus GPS capture and map. */
export function WizardLocationStep({ wizard }: { wizard: WorkshopWizardController }) {
  const t = useT();
  const { locale } = useI18n();
  const { state, fieldErrors } = wizard;
  const geolocation = useGeolocationCapture();
  const gpsState = geolocation.status;

  function captureGps() {
    geolocation.capture({
      onPosition: (latitude, longitude) => wizard.patchLocation({ latitude, longitude }),
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label={t("wizard.governorate")} required error={fieldErrors.governorate}>
        <Select
          value={state.location.governorate}
          onValueChange={(value) =>
            wizard.patchLocation({ governorate: value, ...districtReset() })
          }
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
      <FormField
        label={t("wizard.district")}
        hint={t("wizard.optionalHint")}
        error={fieldErrors.district}
      >
        <DistrictSelect
          governorate={state.location.governorate}
          value={state.location.districtOther ? OTHER_DISTRICT : state.location.district ?? ""}
          onPick={(value) =>
            value === OTHER_DISTRICT
              ? wizard.patchLocation({ district: "", districtOther: true })
              : wizard.patchLocation({ district: value, districtOther: false })
          }
        />
        {state.location.districtOther ? (
          <Input
            className="mt-2"
            value={state.location.district}
            onChange={(event) =>
              wizard.patchLocation({ district: event.target.value, districtOther: true })
            }
            placeholder={t("wizard.districtManualPlaceholder")}
            aria-invalid={Boolean(fieldErrors.district)}
          />
        ) : null}
      </FormField>
      <FormField
        label={t("wizard.address")}
        required
        error={fieldErrors.address}
        className="sm:col-span-2"
      >
        <Input
          value={state.location.address}
          onChange={(event) => wizard.patchLocation({ address: event.target.value })}
          aria-invalid={Boolean(fieldErrors.address)}
          onBlur={wizard.collectCurrentStepErrors}
        />
      </FormField>
      <GpsCaptureFields
        className="sm:col-span-2"
        latitude={state.location.latitude}
        longitude={state.location.longitude}
        onPatch={wizard.patchLocation}
        gpsState={gpsState}
        onCapture={captureGps}
        showCaptured={gpsState === "captured" && state.location.latitude !== null}
        pairAlert={fieldErrors.latitude}
        mapHeight={260}
      />
    </div>
  );
}
