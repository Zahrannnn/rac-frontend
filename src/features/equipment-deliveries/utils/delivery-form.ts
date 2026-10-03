import { mapApiFieldErrorKeys } from "@/shared/utils/api-field-errors";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/shared/utils/datetime";
import type { CreateDeliveryPayload, EquipmentDelivery } from "../types";
import { createDeliverySchema } from "../validations/delivery-schema";

export type DeliveryFormValues = {
  workshopId: string;
  workshopLabel: string;
  equipmentDescription: string;
  recipientName: string;
  recipientPhone: string;
  deliveredAtUtc: string;
  notes: string;
  sourceBadge: string;
};

export type DeliveryFormErrors = Partial<Record<keyof DeliveryFormValues, string>>;

export const EMPTY_DELIVERY_FORM: DeliveryFormValues = {
  workshopId: "",
  workshopLabel: "",
  equipmentDescription: "",
  recipientName: "",
  recipientPhone: "",
  deliveredAtUtc: "",
  notes: "",
  sourceBadge: "",
};

export function formFromDelivery(delivery: EquipmentDelivery): DeliveryFormValues {
  return {
    workshopId: delivery.workshopId,
    workshopLabel: `${delivery.workshopCode} · ${delivery.workshopName}`,
    equipmentDescription: delivery.equipmentDescription,
    recipientName: delivery.recipientName,
    recipientPhone: delivery.recipientPhone ?? "",
    deliveredAtUtc: toDatetimeLocalValue(delivery.deliveredAtUtc),
    notes: delivery.notes ?? "",
    sourceBadge: "",
  };
}

/**
 * Extracts a 400 response's fieldErrors onto form keys. Returns null when the
 * error carries no field-level messages (callers fall back to a generic toast).
 */
export function extractDeliveryFieldErrors(apiError: unknown): Record<string, string> | null {
  const fieldErrors = (apiError as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) return null;
  return mapApiFieldErrorKeys(fieldErrors);
}

export function validateDeliveryForm(
  values: DeliveryFormValues,
  options: { requireWorkshop: boolean }
): {
  valid: boolean;
  errors: DeliveryFormErrors;
  payload: CreateDeliveryPayload | null;
} {
  // Zod parity: the schema mirrors CreateDeliveryRequestValidator; issue messages are
  // i18n dictionary keys the dialog resolves with t().
  const parsed = createDeliverySchema.safeParse(values);

  if (!parsed.success) {
    const errors: DeliveryFormErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof DeliveryFormErrors;
      // Edit flow: the workshop is immutable, so its picker isn't rendered.
      if (field === "workshopId" && !options.requireWorkshop) continue;
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return { valid: false, errors, payload: null };
  }

  const delivered = fromDatetimeLocalValue(values.deliveredAtUtc);
  if (!delivered) {
    return { valid: false, errors: { deliveredAtUtc: "validation.dateInvalid" }, payload: null };
  }

  return {
    valid: true,
    errors: {},
    payload: {
      workshopId: values.workshopId,
      equipmentDescription: values.equipmentDescription.trim(),
      recipientName: values.recipientName.trim(),
      recipientPhone: values.recipientPhone.trim() || null,
      deliveredAtUtc: delivered,
      notes: values.notes.trim() || null,
    },
  };
}
