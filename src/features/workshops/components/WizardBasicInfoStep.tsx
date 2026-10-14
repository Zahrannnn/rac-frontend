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
import { useT } from "@/shared/i18n";
import { WORKSHOP_TYPES } from "../constants/wizard-steps";
import type { WorkshopWizardController } from "../hooks/use-workshop-wizard";

/** Step 2 — basic workshop identity fields, validated per-field on blur. */
export function WizardBasicInfoStep({ wizard }: { wizard: WorkshopWizardController }) {
  const t = useT();
  const { state, fieldErrors } = wizard;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label={t("wizard.nameEn")} required error={fieldErrors.nameEn}>
        <Input
          value={state.basic.nameEn}
          onChange={(event) => wizard.patchBasic({ nameEn: event.target.value })}
          aria-invalid={Boolean(fieldErrors.nameEn)}
          onBlur={wizard.collectCurrentStepErrors}
          autoComplete="organization"
        />
      </FormField>
      <FormField label={t("wizard.nameAr")} hint={t("wizard.optionalHint")}>
        <Input
          value={state.basic.nameAr ?? ""}
          onChange={(event) => wizard.patchBasic({ nameAr: event.target.value })}
        />
      </FormField>
      <FormField label={t("wizard.ownerName")} required error={fieldErrors.ownerName}>
        <Input
          value={state.basic.ownerName}
          onChange={(event) => wizard.patchBasic({ ownerName: event.target.value })}
          aria-invalid={Boolean(fieldErrors.ownerName)}
          onBlur={wizard.collectCurrentStepErrors}
          autoComplete="name"
        />
      </FormField>
      <FormField
        label={t("wizard.mobile")}
        required
        error={fieldErrors.mobile}
        hint={t("wizard.mobileHint")}
      >
        <Input
          value={state.basic.mobile}
          onChange={(event) => wizard.patchBasic({ mobile: event.target.value })}
          aria-invalid={Boolean(fieldErrors.mobile)}
          inputMode="tel"
          dir="ltr"
          className="tabular-nums"
          onBlur={wizard.collectCurrentStepErrors}
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
        />
      </FormField>
      <FormField label={t("wizard.type")}>
        <Select
          value={state.basic.type}
          onValueChange={(value) => wizard.setWorkshopType(value as never)}
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
      <FormField
        label={t("wizard.numberOfTechnicians")}
        error={fieldErrors.numberOfTechnicians}
        hint={t("wizard.optionalHint")}
      >
        <Input
          type="number"
          min={0}
          max={1000}
          value={state.basic.numberOfTechnicians ?? ""}
          onChange={(event) =>
            wizard.patchBasic({
              numberOfTechnicians:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
      </FormField>
      <FormField label={t("wizard.telephone")} hint={t("wizard.optionalHint")}>
        <Input
          value={state.basic.telephone ?? ""}
          onChange={(event) => wizard.patchBasic({ telephone: event.target.value })}
          inputMode="tel"
          dir="ltr"
        />
      </FormField>
      <FormField label={t("wizard.activities")} hint={t("wizard.optionalHint")}>
        <Input
          value={state.basic.activities ?? ""}
          onChange={(event) => wizard.patchBasic({ activities: event.target.value })}
        />
      </FormField>
    </div>
  );
}
