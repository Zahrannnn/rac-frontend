import { describe, expect, it } from "vitest";
import { formatTrainerGain, formatTrainerScore } from "./trainer-format";

describe("formatTrainerScore", () => {
  it("renders one decimal for recorded averages", () => {
    expect(formatTrainerScore(68.44)).toBe("68.4");
    expect(formatTrainerScore(81)).toBe("81.0");
    expect(formatTrainerScore(0)).toBe("0.0");
  });

  it("renders an em dash for missing averages", () => {
    expect(formatTrainerScore(null)).toBe("—");
  });
});

describe("formatTrainerGain", () => {
  it("prefixes a plus sign on positive gains", () => {
    expect(formatTrainerGain(12.5)).toBe("+12.5");
    expect(formatTrainerGain(0.44)).toBe("+0.4");
  });

  it("keeps the minus sign from the number itself", () => {
    expect(formatTrainerGain(-3)).toBe("-3.0");
    expect(formatTrainerGain(0)).toBe("0.0");
  });

  it("renders an em dash for missing gains", () => {
    expect(formatTrainerGain(null)).toBe("—");
  });
});
