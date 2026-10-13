import { describe, expect, it } from "vitest";
import {
  dataUrlBytes,
  fitsSignatureBudget,
  SIGNATURE_MAX_BYTES,
} from "./signature-image";

describe("signature-image budget helpers", () => {
  it("decodes base64 payload sizes (padding-aware)", () => {
    // "data:image/jpeg;base64," + 4 chars of payload ("PPPT") → 3 bytes
    expect(dataUrlBytes("data:image/jpeg;base64,PPPT")).toBe(3);
    // "QQ==" → 1 byte
    expect(dataUrlBytes("data:image/jpeg;base64,QQ==")).toBe(1);
    // "AQI=" → 2 bytes
    expect(dataUrlBytes("data:image/jpeg;base64,AQI=")).toBe(2);
    expect(dataUrlBytes("data:image/jpeg;base64,")).toBe(0);
  });

  it("enforces the 512KB stored-signature ceiling", () => {
    expect(SIGNATURE_MAX_BYTES).toBe(512 * 1024);
    const small = `data:image/jpeg;base64,${"A".repeat(4 * 1024)}`; // ~3KB
    expect(fitsSignatureBudget(small)).toBe(true);
    const huge = `data:image/jpeg;base64,${"A".repeat(4 * SIGNATURE_MAX_BYTES)}`; // ~1.5MB
    expect(fitsSignatureBudget(huge)).toBe(false);
  });
});
