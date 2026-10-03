import { describe, expect, it } from "vitest";
import { formatCoords, googleMapsUrl, hasCoordinates } from "./geo";

describe("hasCoordinates (profile empty-state logic)", () => {
  it("is true only when both coordinates are present", () => {
    expect(hasCoordinates(30.05, 31.24)).toBe(true);
    expect(hasCoordinates(30.05, null)).toBe(false);
    expect(hasCoordinates(null, 31.24)).toBe(false);
    expect(hasCoordinates(null, null)).toBe(false);
    expect(hasCoordinates(undefined, undefined)).toBe(false);
  });
});

describe("formatCoords (profile coordinate display)", () => {
  it("renders western digits with comma separator", () => {
    expect(formatCoords(30.0444, 31.2357)).toBe("30.0444, 31.2357");
  });

  it("trims floating-point noise to 6 dp without trailing zeros", () => {
    expect(formatCoords(30.123456789, 31.100000)).toBe("30.123457, 31.1");
    expect(formatCoords(30, 31)).toBe("30, 31");
  });
});

describe("googleMapsUrl (deep-link only)", () => {
  it("builds the q= link with raw coordinates", () => {
    expect(googleMapsUrl(30.0444, 31.2357)).toBe("https://www.google.com/maps?q=30.0444,31.2357");
  });
});
