"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("equipment.editTitle") : t("equipment.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("equipment.formHint")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
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
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? t("common.loading") : t("equipment.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
