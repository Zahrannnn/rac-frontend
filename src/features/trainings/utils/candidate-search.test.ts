import { describe, expect, it } from "vitest";
import type { TechnicianCandidate } from "../types";
import {
  candidateNames,
  isCandidateSearchReady,
  nextAddableCandidate,
  normalizeCandidateSearch,
} from "./candidate-search";

const candidate = (id: string, fullName: string, fullNameAr?: string | null): TechnicianCandidate => ({
  id,
  fullName,
  fullNameAr,
  workshopCode: "MAC-CAR-000001",
  workshopName: "Workshop",
  governorate: "Cairo",
});

describe("isCandidateSearchReady", () => {
  it("requires two or more trimmed characters", () => {
    expect(isCandidateSearchReady("")).toBe(false);
    expect(isCandidateSearchReady("ا")).toBe(false);
    expect(isCandidateSearchReady("  ا ")).toBe(false);
    expect(isCandidateSearchReady("اح")).toBe(true);
    expect(isCandidateSearchReady("  ahmed ")).toBe(true);
  });
});

describe("normalizeCandidateSearch", () => {
  it("maps Arabic-Indic and Persian digits to Western digits", () => {
    expect(normalizeCandidateSearch("٠١٠٩٨٧٦٥٤٣٢")).toBe("01098765432");
    expect(normalizeCandidateSearch("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(normalizeCandidateSearch("MAC-CAR-٠٠٠١٢٥")).toBe("MAC-CAR-000125");
  });

  it("trims and collapses whitespace without touching letters", () => {
    expect(normalizeCandidateSearch("  محمد   علي ")).toBe("محمد علي");
    expect(normalizeCandidateSearch("Ahmed")).toBe("Ahmed");
    expect(normalizeCandidateSearch("   ")).toBe("");
  });
});

describe("candidateNames", () => {
  it("leads with the UI-language name and adds the other script", () => {
    const both = candidate("t-1", "Mohamed Ali", " محمد علي ");
    expect(candidateNames(both, "ar")).toEqual({ primary: "محمد علي", secondary: "Mohamed Ali" });
    expect(candidateNames(both, "en")).toEqual({ primary: "Mohamed Ali", secondary: "محمد علي" });
  });

  it("falls back to the English name and drops a duplicate secondary", () => {
    expect(candidateNames(candidate("t-1", "Omar", null), "ar")).toEqual({
      primary: "Omar",
      secondary: null,
    });
    expect(candidateNames(candidate("t-1", "Omar", "Omar"), "en").secondary).toBeNull();
  });
});

describe("nextAddableCandidate", () => {
  const list = [candidate("a", "A"), candidate("b", "B"), candidate("c", "C")];

  it("searches forward and wraps around, skipping enrolled technicians", () => {
    expect(nextAddableCandidate(list, "a", new Set())?.id).toBe("b");
    expect(nextAddableCandidate(list, "c", new Set())?.id).toBe("a");
    expect(nextAddableCandidate(list, "a", new Set(["b"]))?.id).toBe("c");
  });

  it("returns undefined when everyone else is enrolled", () => {
    expect(nextAddableCandidate(list, "a", new Set(["b", "c"]))).toBeUndefined();
  });
});
