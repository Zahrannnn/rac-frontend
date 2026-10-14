import { afterEach, describe, expect, it, vi } from "vitest";
import { compressImage } from "@/shared/utils/image-compression";
import {
  compressSignatureImage,
  dataUrlBytes,
  fitsSignatureBudget,
  SIGNATURE_MAX_BYTES,
} from "./signature-image";

/* The shared compression util is stubbed — these tests cover the signature
   pipeline's own decisions (budget passes, the half-size retry, data URL
   wrapping) without pixel encoding. */

vi.mock("@/shared/utils/image-compression", () => ({
  compressImage: vi.fn(),
}));

const compressImageMock = vi.mocked(compressImage);

function webpFile(sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "signature.webp", { type: "image/webp" });
}

afterEach(() => {
  compressImageMock.mockReset();
});

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

  it("enforces the 400KB stored-signature budget (WebP target)", () => {
    expect(SIGNATURE_MAX_BYTES).toBe(400 * 1024);
    const small = `data:image/webp;base64,${"A".repeat(4 * 1024)}`; // ~3KB
    expect(fitsSignatureBudget(small)).toBe(true);
    const huge = `data:image/webp;base64,${"A".repeat(4 * SIGNATURE_MAX_BYTES)}`; // ~1.5MB
    expect(fitsSignatureBudget(huge)).toBe(false);
  });
});

describe("compressSignatureImage (shared canvas pipeline)", () => {
  it("compresses at 1200px against the 400KB budget with a white backdrop", async () => {
    compressImageMock.mockResolvedValue(webpFile(10_000));
    const file = new File([new Uint8Array(300_000)], "sig.jpg", { type: "image/jpeg" });

    const dataUrl = await compressSignatureImage(file);

    expect(compressImageMock).toHaveBeenCalledWith(file, {
      maxSide: 1200,
      targetBytes: SIGNATURE_MAX_BYTES,
      background: "#ffffff",
    });
    expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(fitsSignatureBudget(dataUrl)).toBe(true);
  });

  it("retries at half size when the first pass exceeds the budget", async () => {
    compressImageMock
      .mockResolvedValueOnce(webpFile(SIGNATURE_MAX_BYTES + 1))
      .mockResolvedValueOnce(webpFile(50_000));

    await compressSignatureImage(new File([new Uint8Array(1)], "sig.jpg"));

    expect(compressImageMock).toHaveBeenCalledTimes(2);
    expect(compressImageMock).toHaveBeenLastCalledWith(expect.any(File), {
      maxSide: 600,
      targetBytes: SIGNATURE_MAX_BYTES,
      background: "#ffffff",
    });
  });

  it("throws when even the half-size pass cannot meet the budget", async () => {
    compressImageMock.mockResolvedValue(webpFile(SIGNATURE_MAX_BYTES + 1));

    await expect(
      compressSignatureImage(new File([new Uint8Array(1)], "sig.jpg"))
    ).rejects.toThrow("stored-answers budget");
  });
});
