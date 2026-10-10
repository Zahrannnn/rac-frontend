import { describe, expect, it } from "vitest";
import {
  basicInfoSchema,
  canTransition,
  editWorkshopSchema,
  locationSchema,
} from "./workshop-schema";
import { isEgyptianMobile, normalizeEgyptianMobile } from "@/shared/validation/mobile";

const validBasic = {
  nameEn: "Alexandria AC Workshop",
  nameAr: "",
  ownerName: "Hassan Ali",
  mobile: "01012345678",
  telephone: "",
  type: "Formal",
  activities: "",
  numberOfTechnicians: 4,
};

describe("Egyptian mobile validation (backend PhoneNumber parity)", () => {
  it("accepts the four valid prefixes", () => {
    expect(isEgyptianMobile("01012345678")).toBe(true);
    expect(isEgyptianMobile("01112345678")).toBe(true);
    expect(isEgyptianMobile("01212345678")).toBe(true);
    expect(isEgyptianMobile("01512345678")).toBe(true);
  });

  it("accepts the international and 002 forms the backend normalizes", () => {
    expect(isEgyptianMobile("+201012345678")).toBe(true);
    expect(isEgyptianMobile("201012345678")).toBe(true);
    expect(isEgyptianMobile("00201012345678")).toBe(true);
    expect(isEgyptianMobile("010-1234-5678")).toBe(true);
    expect(isEgyptianMobile("(010) 1234 5678")).toBe(true);
    expect(normalizeEgyptianMobile("+201012345678")).toBe("201012345678");
  });

  it("rejects invalid prefixes, short numbers and non-digits", () => {
    expect(isEgyptianMobile("01312345678")).toBe(false);
    expect(isEgyptianMobile("0101234567")).toBe(false);
    expect(isEgyptianMobile("011123456789")).toBe(false);
    expect(isEgyptianMobile("abcd1234567")).toBe(false);
  });
});

describe("basicInfoSchema", () => {
  it("accepts a complete basic step", () => {
    expect(basicInfoSchema.safeParse(validBasic).success).toBe(true);
  });

  it("rejects a missing name or owner", () => {
    expect(basicInfoSchema.safeParse({ ...validBasic, nameEn: "" }).success).toBe(false);
    expect(basicInfoSchema.safeParse({ ...validBasic, ownerName: "  " }).success).toBe(false);
  });

  it("rejects out-of-range technician counts", () => {
    expect(basicInfoSchema.safeParse({ ...validBasic, numberOfTechnicians: -1 }).success).toBe(false);
    expect(basicInfoSchema.safeParse({ ...validBasic, numberOfTechnicians: 1001 }).success).toBe(false);
  });
});

describe("locationSchema", () => {
  const validLocation = {
    governorate: "Cairo",
    district: "",
    address: "12 Ramses St",
    latitude: null,
    longitude: null,
  };

  it("accepts a location without GPS", () => {
    expect(locationSchema.safeParse(validLocation).success).toBe(true);
  });

  it("accepts GPS inside Egypt's bounds", () => {
    expect(
      locationSchema.safeParse({ ...validLocation, latitude: 30.05, longitude: 31.24 }).success
    ).toBe(true);
  });

  it("rejects half-provided GPS pairs", () => {
    expect(
      locationSchema.safeParse({ ...validLocation, latitude: 30.05, longitude: null }).success
    ).toBe(false);
  });

  it("rejects coordinates outside Egypt", () => {
    expect(
      locationSchema.safeParse({ ...validLocation, latitude: 48.85, longitude: 2.35 }).success
    ).toBe(false);
  });

  it("rejects unknown governorates", () => {
    expect(
      locationSchema.safeParse({ ...validLocation, governorate: "Atlantis" }).success
    ).toBe(false);
  });
});

describe("editWorkshopSchema GPS", () => {
  const validEdit = {
    nameEn: "Alexandria AC Workshop",
    nameAr: "",
    ownerName: "Hassan Ali",
    mobile: "01012345678",
    telephone: "",
    type: "Formal" as const,
    governorate: "Cairo",
    district: "",
    address: "12 Ramses St",
    activities: "",
    numberOfTechnicians: 4,
    notes: "",
    latitude: null,
    longitude: null,
  };

  it("accepts edit without GPS", () => {
    expect(editWorkshopSchema.safeParse(validEdit).success).toBe(true);
  });

  it("rejects half GPS pairs on edit", () => {
    expect(
      editWorkshopSchema.safeParse({ ...validEdit, latitude: 30.05, longitude: null }).success
    ).toBe(false);
  });
});

describe("canTransition (lifecycle guard)", () => {
  it("allows the forward path without skipping", () => {
    expect(canTransition("Draft", "Submitted")).toBe(true);
    expect(canTransition("Submitted", "Complete")).toBe(true);
    expect(canTransition("Submitted", "Incomplete")).toBe(true);
    expect(canTransition("Incomplete", "Submitted")).toBe(true);
  });

  it("forbids skipping and terminal transitions", () => {
    // ADR-0004: Complete is terminal (the former Scored state is demolished).
    expect(canTransition("Draft", "Complete")).toBe(false);
    expect(canTransition("Complete", "Submitted")).toBe(false);
  });
});
