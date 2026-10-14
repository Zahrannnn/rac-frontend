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
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { OTHER_DISTRICT } from "@/shared/constants/districts";
import { useI18n, useT } from "@/shared/i18n";
import { WORKSHOP_TYPES } from "../constants/wizard-steps";
import type { EditWorkshopValues } from "../validations/workshop-schema";
import { parseOptionalNumber } from "../utils/number-input";
import { DistrictSelect } from "./district-select";
import type { WorkshopType } from "../types";

type WorkshopEditFieldsProps = {
  values: EditWorkshopValues;
  errors: Record<string, string>;
  /** Other-district escape hatch is selected (manual entry shown). */
  districtOther: boolean;
  onDistrictOtherChange: (other: boolean) => void;
  /** Merge a field change into the edit-form state. */
  onPatch: (patch: Partial<EditWorkshopValues>) => void;
};

/**
 * The edit form's field grid (identity, location, contact, notes) — a
 * controlled fragment; form state, validation and saving live in the parent.
 */
export function WorkshopEditFields({
  values,
  errors,
  districtOther,
  onDistrictOtherChange,
  onPatch,
}: WorkshopEditFieldsProps) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <>
      <FormField label={t("wizard.nameEn")} error={errors.nameEn}>
        <Input
          value={values.nameEn}
          onChange={(event) => onPatch({ nameEn: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.nameAr")}>
        <Input
          value={values.nameAr ?? ""}
          onChange={(event) => onPatch({ nameAr: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.ownerName")} error={errors.ownerName}>
        <Input
          value={values.ownerName}
          onChange={(event) => onPatch({ ownerName: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.mobile")} error={errors.mobile}>
        <Input
          value={values.mobile}
          onChange={(event) => onPatch({ mobile: event.target.value })}
          inputMode="tel"
        />
      </FormField>
      <FormField label={t("wizard.type")}>
        <Select
          value={values.type}
          onValueChange={(value) => onPatch({ type: value as WorkshopType })}
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
            onPatch({
              governorate: value as EditWorkshopValues["governorate"],
              district: "",
            });
            onDistrictOtherChange(false);
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
          onChange={(event) => onPatch({ address: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.district")} error={errors.district}>
        <DistrictSelect
          governorate={values.governorate}
          value={districtOther ? OTHER_DISTRICT : values.district ?? ""}
          onPick={(value) => {
            if (value === OTHER_DISTRICT) {
              onDistrictOtherChange(true);
              onPatch({ district: "" });
            } else {
              onDistrictOtherChange(false);
              onPatch({ district: value });
            }
          }}
        />
        {districtOther ? (
          <Input
            className="mt-2"
            value={values.district ?? ""}
            onChange={(event) => onPatch({ district: event.target.value })}
            placeholder={t("wizard.districtManualPlaceholder")}
            aria-invalid={Boolean(errors.district)}
          />
        ) : null}
      </FormField>
      <FormField label={t("wizard.telephone")}>
        <Input
          value={values.telephone ?? ""}
          onChange={(event) => onPatch({ telephone: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.numberOfTechnicians")} error={errors.numberOfTechnicians}>
        <Input
          type="number"
          min={0}
          max={1000}
          value={values.numberOfTechnicians ?? ""}
          onChange={(event) =>
            onPatch({ numberOfTechnicians: parseOptionalNumber(event.target.value) })
          }
        />
      </FormField>
      <FormField label={t("wizard.activities")}>
        <Input
          value={values.activities ?? ""}
          onChange={(event) => onPatch({ activities: event.target.value })}
        />
      </FormField>
      <FormField label={t("profile.notes")} className="sm:col-span-2">
        <Input
          value={values.notes ?? ""}
          onChange={(event) => onPatch({ notes: event.target.value })}
        />
      </FormField>
    </>
  );
}
