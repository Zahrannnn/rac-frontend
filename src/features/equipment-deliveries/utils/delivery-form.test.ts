import { describe, expect, it } from "vitest";
import { EMPTY_DELIVERY_FORM, validateDeliveryForm } from "./delivery-form";

describe("delivery-form", () => {
  it("requires workshop, equipment, recipient, and delivered date", () => {
    const result = validateDeliveryForm(EMPTY_DELIVERY_FORM, { requireWorkshop: true });
    expect(result.valid).toBe(false);
    expect(result.errors.workshopId).toBe("validation.workshopRequired");
    expect(result.errors.equipmentDescription).toBe("validation.required");
    expect(result.errors.recipientName).toBe("validation.required");
    expect(result.errors.deliveredAtUtc).toBe("validation.required");
  });

  it("rejects invalid Egyptian mobile", () => {
    const result = validateDeliveryForm(
      {
        ...EMPTY_DELIVERY_FORM,
        workshopId: "w1",
        equipmentDescription: "Recovery unit",
        recipientName: "Owner",
        recipientPhone: "123",
        deliveredAtUtc: "2026-09-22T10:00",
      },
      { requireWorkshop: true }
    );
    expect(result.valid).toBe(false);
    expect(result.errors.recipientPhone).toBe("validation.recipientPhoneInvalid");
  });

  it("accepts a valid payload", () => {
    const result = validateDeliveryForm(
      {
        ...EMPTY_DELIVERY_FORM,
        workshopId: "w1",
        equipmentDescription: "Recovery unit",
        recipientName: "Owner",
        recipientPhone: "01012345678",
        deliveredAtUtc: "2026-09-22T10:00",
      },
      { requireWorkshop: true }
    );
    expect(result.valid).toBe(true);
    expect(result.payload?.recipientPhone).toBe("01012345678");
  });
});
