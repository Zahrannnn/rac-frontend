import { describe, expect, it } from "vitest";
import {
  isValidEgyptianNationalId,
  parseEgyptianNationalId,
} from "./egyptian-national-id";

/** Computes the §10B check digit for a 13-digit prefix (weights 2,7,6,5,4,3,2,7,6,5,4,3,2). */
function withCheck(first13: string): string {
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = first13
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return first13 + (remainder === 0 ? 0 : 11 - remainder);
}

describe("egyptian-national-id (REGISTRY-GAS-SPEC §10B)", () => {
  it("accepts a full-formula ID and derives gender + age", () => {
    // 2001-01-01, Cairo (01), serial 001, male parity.
    const id = withCheck("3010101010011");
    const identity = parseEgyptianNationalId(id);
    expect(identity).not.toBeNull();
    expect(identity?.gender).toBe("male");
    expect(identity?.birthDate.getFullYear()).toBe(2001);
    expect(identity?.age).toBe(new Date().getFullYear() - 2001);
  });

  it("derives female from an even 13th digit", () => {
    expect(parseEgyptianNationalId(withCheck("3010101010010"))?.gender).toBe("female");
  });

  it("maps century digit 2 into the 1900s", () => {
    expect(parseEgyptianNationalId(withCheck("2900101010011"))?.birthDate.getFullYear()).toBe(
      1990
    );
  });

  it.each([
    ["13456789012345"], // century digit 1
    ["43456789012345"], // century digit 4
    ["2345678901234"], // 13 digits
    ["234567890123456"], // 15 digits
    ["2A456789012345"], // letter
    [""],
  ])("rejects malformed %s", (value) => {
    expect(isValidEgyptianNationalId(value)).toBe(false);
  });

  it("rejects impossible birth dates", () => {
    expect(isValidEgyptianNationalId(withCheck("3011301010011"))).toBe(false); // month 13
    expect(isValidEgyptianNationalId(withCheck("3010230010011"))).toBe(false); // Feb 30
    expect(isValidEgyptianNationalId(withCheck("3010231010011"))).toBe(false); // Feb 31
  });

  it("rejects unknown birth-governorate codes", () => {
    expect(isValidEgyptianNationalId(withCheck("3010101990011"))).toBe(false); // 99
    expect(isValidEgyptianNationalId(withCheck("3010101050011"))).toBe(false); // 05 unused
    expect(isValidEgyptianNationalId(withCheck("3010101880011"))).toBe(true); // 88 outside
  });

  it("rejects a broken check digit", () => {
    const id = withCheck("3010101010011");
    const broken = id.slice(0, 13) + (id[13] === "0" ? "1" : "0");
    expect(isValidEgyptianNationalId(id)).toBe(true);
    expect(isValidEgyptianNationalId(broken)).toBe(false);
  });

  it("returns null for absent or blank input", () => {
    expect(parseEgyptianNationalId(null)).toBeNull();
    expect(parseEgyptianNationalId(undefined)).toBeNull();
    expect(parseEgyptianNationalId("")).toBeNull();
    expect(parseEgyptianNationalId("   ")).toBeNull();
  });
});
