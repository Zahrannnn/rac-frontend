import { describe, expect, it } from "vitest";
import { isJsonObject } from "./config-json";

describe("isJsonObject", () => {
  it("accepts JSON objects", () => {
    expect(isJsonObject("{}")).toBe(true);
    expect(isJsonObject('{"minPhotos": 3}')).toBe(true);
  });

  it("rejects arrays, primitives and invalid JSON", () => {
    expect(isJsonObject("[1]")).toBe(false);
    expect(isJsonObject("null")).toBe(false);
    expect(isJsonObject('"x"')).toBe(false);
    expect(isJsonObject("42")).toBe(false);
    expect(isJsonObject("{")).toBe(false);
  });
});
