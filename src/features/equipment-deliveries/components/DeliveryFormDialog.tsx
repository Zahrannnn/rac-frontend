"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/shared/i18n";
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
import { DeliveryFormFields } from "./DeliveryFormFields";

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
          <DeliveryFormFields
            values={values}
            errors={errors}
            submitted={submitted}
            set={set}
            editing={Boolean(editing)}
            recommended={recommended}
            pickRecommended={pickRecommended}
          />
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
