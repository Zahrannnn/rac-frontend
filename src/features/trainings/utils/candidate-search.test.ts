import { describe, expect, it } from "vitest";
import { isCandidateSearchReady } from "./candidate-search";

describe("isCandidateSearchReady", () => {
  it("requires two or more trimmed characters", () => {
    expect(isCandidateSearchReady("")).toBe(false);
    expect(isCandidateSearchReady("ا")).toBe(false);
    expect(isCandidateSearchReady("  ا ")).toBe(false);
    expect(isCandidateSearchReady("اح")).toBe(true);
    expect(isCandidateSearchReady("  ahmed ")).toBe(true);
  });
});
