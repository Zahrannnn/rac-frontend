import { describe, expect, it } from "vitest";
import { EMPTY_TRAINING_FORM, validateTrainingForm } from "./training-form";

describe("training-form", () => {
  it("requires trainer, venue, governorate, and ordered dates (zod dictionary keys)", () => {
    const result = validateTrainingForm(EMPTY_TRAINING_FORM);
    expect(result.valid).toBe(false);
    expect(result.errors.trainerName).toBe("validation.required");
    expect(result.errors.venue).toBe("validation.required");
    expect(result.errors.governorate).toBe("validation.governorateInvalid");
    expect(result.errors.startAtUtc).toBe("validation.required");
  });

  it("rejects end before start", () => {
    const result = validateTrainingForm({
      ...EMPTY_TRAINING_FORM,
      trainerName: "Trainer",
      venue: "Venue",
      governorate: "Cairo",
      startAtUtc: "2026-09-22T12:00",
      endAtUtc: "2026-09-22T11:00",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.endAtUtc).toBe("validation.dateOrder");
  });

  it("builds a create payload for a valid form", () => {
    const result = validateTrainingForm({
      ...EMPTY_TRAINING_FORM,
      trainerName: "Amina",
      trainerKey: "amina-1",
      venue: "NOU Hall",
      governorate: "Cairo",
      startAtUtc: "2026-09-22T09:00",
      endAtUtc: "2026-09-22T17:00",
      title: "R290 safety",
    });
    expect(result.valid).toBe(true);
    expect(result.payload?.trainerName).toBe("Amina");
    expect(result.payload?.startAtUtc).toBe("2026-09-22T09:00:00.000Z");
    expect(result.payload?.endAtUtc).toBe("2026-09-22T17:00:00.000Z");
  });
});
