import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLastSectionKey,
  readLastSectionKey,
  writeLastSectionKey,
} from "./resume";

beforeEach(() => {
  window.localStorage.clear();
});

describe("resume storage (last-visited section per survey)", () => {
  it("round-trips the last section key per survey id", () => {
    writeLastSectionKey("sv-1", "workforce");
    writeLastSectionKey("sv-2", "closing");

    expect(readLastSectionKey("sv-1")).toBe("workforce");
    expect(readLastSectionKey("sv-2")).toBe("closing");
  });

  it("clears the stored key", () => {
    writeLastSectionKey("sv-1", "workforce");
    clearLastSectionKey("sv-1");
    expect(readLastSectionKey("sv-1")).toBeNull();
  });

  it("returns null for unknown surveys without throwing", () => {
    expect(readLastSectionKey("sv-none")).toBeNull();
  });

  it("survives storage failures (private mode)", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      expect(() => writeLastSectionKey("sv-1", "workforce")).not.toThrow();
      expect(readLastSectionKey("sv-1")).toBeNull();
    } finally {
      setItem.mockRestore();
      getItem.mockRestore();
    }
  });
});
