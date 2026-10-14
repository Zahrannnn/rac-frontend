"use client";

import { DateTimePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/form/form-field";
import { createFieldErrorMapper } from "@/shared/form/field-error";
import { useT } from "@/shared/i18n";
import type { useRecommendedCompanies } from "@/features/selection";
import type {
  DeliveryFormErrors,
  DeliveryFormValues,
} from "../utils/delivery-form";

/** Legacy short codes map into the equipment dictionary; unknown codes fall
 * back to the generic required message (matches the pre-extraction mapper). */
const fieldError = createFieldErrorMapper({
  legacyCodes: {
    required: "equipment.validation.required",
    max: "equipment.validation.max",
    phone: "equipment.validation.phone",
  },
  fallback: "equipment.validation.required",
});

/** The delivery form's field groups — workshop picking (create only) plus the
 * equipment, recipient and timing fields. Pure presentation over the shared
 * form state; the recommended-companies query stays with the dialog. */
export function DeliveryFormFields({
  values,
  errors,
  submitted,
  set,
  editing,
  recommended,
  pickRecommended,
}: {
  values: DeliveryFormValues;
  errors: DeliveryFormErrors;
  submitted: boolean;
  set: (key: keyof DeliveryFormValues) => (value: string) => void;
  editing: boolean;
  recommended: ReturnType<typeof useRecommendedCompanies>["data"];
  pickRecommended: (workshopId: string) => void;
}) {
  const t = useT();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!editing ? (
        <FormField
          className="sm:col-span-2"
          label={t("equipment.workshop")}
          required
          error={submitted ? fieldError(t, errors.workshopId) : undefined}
        >
          <Select
            value={values.workshopId || undefined}
            onValueChange={(workshopId) => pickRecommended(workshopId)}
          >
            <SelectTrigger aria-invalid={submitted && Boolean(errors.workshopId)}>
              <SelectValue placeholder={t("equipment.pickWorkshop")} />
            </SelectTrigger>
            <SelectContent>
              {(recommended?.items ?? []).map((item) => (
                <SelectItem key={item.workshopId} value={item.workshopId}>
                  {item.code} · {item.name} ({item.governorate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {values.sourceBadge ? (
            <p className="text-xs text-muted-foreground">
              {t("equipment.source", { source: values.sourceBadge })}
            </p>
          ) : null}
          {(recommended?.items.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">{t("equipment.noRecommended")}</p>
          ) : null}
        </FormField>
      ) : (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <p className="text-sm font-medium">{t("equipment.workshop")}</p>
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {values.workshopLabel}
          </p>
        </div>
      )}

      <FormField
        className="sm:col-span-2"
        label={t("equipment.description")}
        required
        error={submitted ? fieldError(t, errors.equipmentDescription) : undefined}
      >
        <Textarea
          value={values.equipmentDescription}
          onChange={(e) => set("equipmentDescription")(e.target.value)}
          rows={3}
        />
      </FormField>
      <FormField
        label={t("equipment.recipientName")}
        required
        error={submitted ? fieldError(t, errors.recipientName) : undefined}
      >
        <Input
          value={values.recipientName}
          onChange={(e) => set("recipientName")(e.target.value)}
        />
      </FormField>
      <FormField
        label={t("equipment.recipientPhone")}
        error={submitted ? fieldError(t, errors.recipientPhone) : undefined}
      >
        <Input
          dir="ltr"
          inputMode="tel"
          value={values.recipientPhone}
          onChange={(e) => set("recipientPhone")(e.target.value)}
          placeholder="01XXXXXXXXX"
        />
      </FormField>
      <FormField
        label={t("equipment.deliveredAt")}
        required
        error={submitted ? fieldError(t, errors.deliveredAtUtc) : undefined}
      >
        <DateTimePicker
          value={values.deliveredAtUtc}
          onChange={set("deliveredAtUtc")}
        />
      </FormField>
      <FormField
        className="sm:col-span-2"
        label={t("equipment.notes")}
        error={submitted ? fieldError(t, errors.notes) : undefined}
      >
        <Textarea value={values.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} />
      </FormField>
    </div>
  );
}
