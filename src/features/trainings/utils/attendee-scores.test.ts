import { describe, expect, it } from "vitest";
import {
  isAttendeeScoreInRange,
  parseAttendeeScore,
  parseAttendeeScorePair,
} from "./attendee-scores";

describe("attendee-scores", () => {
  it("treats blank input as no score recorded (null)", () => {
    expect(parseAttendeeScore("")).toBeNull();
    expect(parseAttendeeScore("   ")).toBeNull();
  });

  it("parses whole-number input", () => {
    expect(parseAttendeeScore("85")).toBe(85);
  });

  it("flags fractional input as invalid (backend takes int)", () => {
    expect(parseAttendeeScore("85.5")).toBeUndefined();
  });

  it("flags unparseable input as invalid (undefined)", () => {
    expect(parseAttendeeScore("abc")).toBeUndefined();
  });

  it("accepts missing scores and the 0-100 range", () => {
    expect(isAttendeeScoreInRange(null)).toBe(true);
    expect(isAttendeeScoreInRange(0)).toBe(true);
    expect(isAttendeeScoreInRange(100)).toBe(true);
  });

  it("rejects out-of-range scores", () => {
    expect(isAttendeeScoreInRange(-1)).toBe(false);
    expect(isAttendeeScoreInRange(101)).toBe(false);
  });
});

describe("parseAttendeeScorePair", () => {
  it("accepts both blank (no scores recorded)", () => {
    expect(parseAttendeeScorePair("", "")).toEqual({ pre: null, post: null });
  });

  it("accepts blank pre-score with a numeric post-score", () => {
    expect(parseAttendeeScorePair("", "70")).toEqual({ pre: null, post: 70 });
  });

  it("rejects when either input is unparseable or fractional", () => {
    expect(parseAttendeeScorePair("abc", "70")).toBeUndefined();
    expect(parseAttendeeScorePair("70", "85.5")).toBeUndefined();
  });

  it("rejects when either input is out of range", () => {
    expect(parseAttendeeScorePair("101", "70")).toBeUndefined();
    expect(parseAttendeeScorePair("70", "-1")).toBeUndefined();
  });

  it("accepts the inclusive 0-100 bounds", () => {
    expect(parseAttendeeScorePair("0", "100")).toEqual({ pre: 0, post: 100 });
  });
});
