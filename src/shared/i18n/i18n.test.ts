import { describe, expect, it } from "vitest";
import { ar } from "./ar";
import { en } from "./en";

describe("i18n dictionary parity", () => {
  it("en defines exactly the ar key set", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
  });

  it("has no empty translations", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), `en.${key}`).not.toBe("");
    }
    for (const [key, value] of Object.entries(ar)) {
      expect(String(value).trim(), `ar.${key}`).not.toBe("");
    }
  });
});
