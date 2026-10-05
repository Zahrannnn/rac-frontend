"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/form/form-field";
import { useT, type TranslationKey } from "@/shared/i18n";
import { useRecommendedCompanies } from "@/features/selection";
import { useCreateDelivery, useUpdateDelivery } from "../hooks/use-equipment";
import type { CreateDeliveryPayload, EquipmentDelivery } from "../types";
import {
  EMPTY_DELIVERY_FORM,
  formFromDelivery,
  extractDeliveryFieldErrors,
  validateDeliveryForm,
  type DeliveryFormErrors,
  type DeliveryFormValues,
} from "../utils/delivery-form";

function fieldError(t: ReturnType<typeof useT>, code: string | undefined) {
  if (!code) return undefined;
  // Zod issues carry dictionary keys ("validation.*") — legacy codes still map.
  if (code.startsWith("validation.")) return t(code as TranslationKey);
  if (code === "required") return t("equipment.validation.required");
  if (code === "max") return t("equipment.validation.max");
  if (code === "phone") return t("equipment.validation.phone");
  return t("equipment.validation.required");
}

export function DeliveryFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EquipmentDelivery | null;
}) {
  const t = useT();
  const create = useCreateDelivery();
  const update = useUpdateDelivery(editing?.id ?? "");
  const { data: recommended } = useRecommendedCompanies();

  const [values, setValues] = useState<DeliveryFormValues>(EMPTY_DELIVERY_FORM);
  const [errors, setErrors] = useState<DeliveryFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditing, setPrevEditing] = useState(editing);

  if (prevOpen !== open || prevEditing !== editing) {
    setPrevOpen(open);
    setPrevEditing(editing);
    if (open) {
      setValues(editing ? formFromDelivery(editing) : EMPTY_DELIVERY_FORM);
      setErrors({});
      setSubmitted(false);
    }
  }

  const set =
    (key: keyof DeliveryFormValues) =>
    (value: string) =>
      setValues((prev) => ({ ...prev, [key]: value }));

  const pickRecommended = (workshopId: string) => {
    const item = recommended?.items.find((c) => c.workshopId === workshopId);
    if (!item) return;
    setValues((prev) => ({
      ...prev,
      workshopId: item.workshopId,
      workshopLabel: `${item.code} · ${item.name}`,
      sourceBadge: recommended?.source ?? "",
    }));
  };

  // 400 + fieldErrors → mirror server-side messages onto the form fields.
  const mirrorFieldErrors = (apiError: unknown) => {
    const mapped = extractDeliveryFieldErrors(apiError);
    if (!mapped) return false;
    setErrors(mapped);
    return true;
  };

  const submitUpdate = (payload: CreateDeliveryPayload) => {
    // workshopId is immutable on edit — omitted from the update wire payload.
    update.mutate(
      {
        equipmentDescription: payload.equipmentDescription,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        deliveredAtUtc: payload.deliveredAtUtc,
        notes: payload.notes,
      },
      {
        onSuccess: () => {
          toast.success(t("equipment.updated"));
          onOpenChange(false);
        },
        onError: (apiError) => {
          if (mirrorFieldErrors(apiError)) return;
          toast.error(t("equipment.saveFailed"));
        },
      }
    );
  };

  const submitCreate = (payload: CreateDeliveryPayload) => {
    create.mutate(payload, {
      onSuccess: () => {
        toast.success(t("equipment.created"));
        onOpenChange(false);
      },
      onError: (apiError) => {
        const status = (apiError as { status?: number }).status;
        if (mirrorFieldErrors(apiError)) return;
        toast.error(
          status === 404
            ? t("equipment.workshopNotFound")
            : t("equipment.saveFailed")
        );
      },
    });
  };

  const save = () => {
    setSubmitted(true);
    const result = validateDeliveryForm(values, { requireWorkshop: !editing });
    setErrors(result.errors);
    if (!result.valid || !result.payload) return;
    if (editing) {
      submitUpdate(result.payload);
      return;
    }
    submitCreate(result.payload);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-4 overflow-y-auto sm:max-w-lg">
        <div>
          <DialogTitle>
            {editing ? t("equipment.editTitle") : t("equipment.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("equipment.formHint")}</DialogDescription>
        </div>

        {!editing ? (
          <FormField
            label={t("equipment.workshop")}
            required
            error={submitted ? fieldError(t, errors.workshopId) : undefined}
          >
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={values.workshopId}
              onChange={(e) => pickRecommended(e.target.value)}
              aria-invalid={submitted && Boolean(errors.workshopId)}
            >
              <option value="">{t("equipment.pickWorkshop")}</option>
              {(recommended?.items ?? []).map((item) => (
                <option key={item.workshopId} value={item.workshopId}>
                  {item.code} · {item.name} ({item.governorate})
                </option>
              ))}
            </select>
            {values.sourceBadge ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("equipment.source", { source: values.sourceBadge })}
              </p>
            ) : null}
            {(recommended?.items.length ?? 0) === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("equipment.noRecommended")}</p>
            ) : null}
          </FormField>
        ) : (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{values.workshopLabel}</p>
        )}

        <FormField
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
          label={t("equipment.notes")}
          error={submitted ? fieldError(t, errors.notes) : undefined}
        >
          <Textarea value={values.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} />
        </FormField>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? t("common.loading") : t("equipment.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
