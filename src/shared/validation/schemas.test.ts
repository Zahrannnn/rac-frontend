import { describe, expect, it } from "vitest";
import { createDeliverySchema } from "@/features/equipment-deliveries/validations/delivery-schema";
import { createTrainingSchema } from "@/features/trainings/validations/training-schema";
import { weightsSchema } from "@/features/selection/validations/weights-schema";

describe("edge-input validation parity (brief Part 3.5)", () => {
  const validDelivery = {
    workshopId: "d1",
    equipmentDescription: "2× recovery unit RRU-200 (cold ❄️)",
    recipientName: "حسن علي — ورشة الحرفي",
    recipientPhone: "",
    deliveredAtUtc: "2026-09-20T10:00:00Z",
    notes: "",
  };

  it("delivery: accepts Arabic/emoji text, trims whitespace, optional phone", () => {
    const parsed = createDeliverySchema.safeParse({
      ...validDelivery,
      equipmentDescription: "  وحدات استرداد — فحص ✅  ",
      recipientPhone: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("delivery: rejects phone that is not Egyptian (limit/format probe)", () => {
    const parsed = createDeliverySchema.safeParse({
      ...validDelivery,
      recipientPhone: "0109988776",
    });
    expect(parsed.success).toBe(false);
  });

  it("delivery: rejects description at max+1", () => {
    const parsed = createDeliverySchema.safeParse({
      ...validDelivery,
      equipmentDescription: "أ".repeat(1001),
    });
    expect(parsed.success).toBe(false);
  });

  it("delivery: accepts description at exactly max", () => {
    const parsed = createDeliverySchema.safeParse({
      ...validDelivery,
      equipmentDescription: "أ".repeat(1000),
    });
    expect(parsed.success).toBe(true);
  });

  const validTraining = {
    trainerName: "م. أحمد",
    trainerKey: "",
    title: "",
    venue: "قاعة NOU",
    governorate: "Cairo",
    startAtUtc: "2026-09-22T09:00",
    endAtUtc: "2026-09-22T17:00",
    notes: "",
  };

  it("training: accepts Arabic/emoji trainer and venue, empty optionals", () => {
    const parsed = createTrainingSchema.safeParse({
      ...validTraining,
      trainerName: "مدربة 🧪 — Amina",
      venue: "قاعة التدريب ٢",
    });
    expect(parsed.success).toBe(true);
  });

  it("training: rejects trainerName at max+1 (129), accepts exactly 128", () => {
    expect(
      createTrainingSchema.safeParse({ ...validTraining, trainerName: "أ".repeat(129) }).success
    ).toBe(false);
    expect(
      createTrainingSchema.safeParse({ ...validTraining, trainerName: "أ".repeat(128) }).success
    ).toBe(true);
  });

  it("training: rejects end == start and end < start (boundary dates)", () => {
    expect(
      createTrainingSchema.safeParse({ ...validTraining, endAtUtc: "2026-09-22T09:00" }).success
    ).toBe(false);
    expect(
      createTrainingSchema.safeParse({ ...validTraining, endAtUtc: "2026-09-22T08:59" }).success
    ).toBe(false);
  });

  it("training: rejects unknown governorate", () => {
    expect(
      createTrainingSchema.safeParse({ ...validTraining, governorate: "Atlantis" }).success
    ).toBe(false);
  });

  it("weights: exact 100 passes, 99.99 passes tolerance, 100.02 fails", () => {
    const base = {
      technical_profile: 0,
      refrigerant_exposure: 0,
      competency_gaps: 0,
      environmental_performance: 0,
      geographic_representation: 0,
    };
    expect(
      weightsSchema.safeParse({ ...base, rac_activity: 100, commitment: 0 }).success
    ).toBe(true);
    expect(
      weightsSchema.safeParse({ ...base, rac_activity: 99.995, commitment: 0 }).success
    ).toBe(true);
    expect(
      weightsSchema.safeParse({ ...base, rac_activity: 100.02, commitment: 0 }).success
    ).toBe(false);
  });
});
