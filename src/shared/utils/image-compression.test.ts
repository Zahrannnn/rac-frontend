import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compressImage,
  IMAGE_STORED_MAX_BYTES,
  IMAGE_UPLOAD_MAX_INPUT_BYTES,
  prepareImageForUpload,
} from "./image-compression";

/* jsdom has no image decoders or canvas encoders — the decision logic
   (skip / downscale / ladder / fallback / guards) is exercised by stubbing
   createImageBitmap and the canvas 2d context + toBlob. No pixel encoding. */

type BlobFactory = (mime: string, quality: number | undefined) => Blob | null;

function makeFile(sizeBytes: number, name = "photo.jpg", type = "image/jpeg"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function makeBitmap(width: number, height: number): ImageBitmap {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

function stubDecoder(width: number, height: number): void {
  vi.stubGlobal("createImageBitmap", vi.fn(async () => makeBitmap(width, height)));
}

interface CanvasRecording {
  toBlobCalls: { mime: string; quality: number | undefined }[];
  drawnSizes: { width: number; height: number }[];
  filledRects: number;
}

function stubCanvas(factory: BlobFactory): CanvasRecording {
  const recording: CanvasRecording = { toBlobCalls: [], drawnSizes: [], filledRects: 0 };
  const context = {
    fillStyle: "",
    fillRect: vi.fn(() => {
      recording.filledRects += 1;
    }),
    drawImage: vi.fn(
      (_source: unknown, _x: number, _y: number, width?: number, height?: number) => {
        recording.drawnSizes.push({ width: width ?? 0, height: height ?? 0 });
      }
    ),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    callback: BlobCallback,
    mime?: string,
    quality?: number
  ) {
    recording.toBlobCalls.push({ mime: mime ?? "", quality });
    callback(factory(mime ?? "", quality));
  });
  return recording;
}

const blobOf = (bytes: number, mime: string): Blob => new Blob([new Uint8Array(bytes)], { type: mime });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("image size constants", () => {
  it("caps originals at 20MB and stored images at 2MB", () => {
    expect(IMAGE_UPLOAD_MAX_INPUT_BYTES).toBe(20 * 1024 * 1024);
    expect(IMAGE_STORED_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe("compressImage — skip path", () => {
  it("returns tiny small-dimension originals unchanged (identity, no encode)", async () => {
    stubDecoder(800, 600);
    const recording = stubCanvas(() => {
      throw new Error("must not encode");
    });
    const file = makeFile(100); // ≤ 400KB default target

    const result = await compressImage(file);

    expect(result).toBe(file);
    expect(recording.toBlobCalls).toHaveLength(0);
  });

  it("re-encodes when dimensions exceed maxSide even if the file is tiny", async () => {
    stubDecoder(4000, 100);
    const recording = stubCanvas((mime, quality) => blobOf(10, `${mime}@${quality}`));
    const file = makeFile(100);

    const result = await compressImage(file, { targetBytes: 20 });

    expect(result).not.toBe(file);
    expect(result.name).toBe("photo.webp");
    expect(result.type).toBe("image/webp");
    expect(recording.drawnSizes).toEqual([{ width: 2048, height: 51 }]);
  });
});

describe("compressImage — downscale + quality ladder", () => {
  it("downscales the longest side to maxSide and preserves aspect ratio", async () => {
    stubDecoder(4000, 2000);
    const recording = stubCanvas((_mime, quality) => blobOf(quality === 0.85 ? 900 : 100, "image/webp"));
    const file = makeFile(5000);

    const result = await compressImage(file, { targetBytes: 500 });

    expect(recording.drawnSizes).toEqual([{ width: 2048, height: 1024 }]);
    expect(result.type).toBe("image/webp");
  });

  it("steps down the ladder until a rung fits the target budget", async () => {
    stubDecoder(1000, 1000);
    const recording = stubCanvas((_mime, quality) =>
      blobOf(quality === 0.7 ? 300 : 900, "image/webp")
    );
    const file = makeFile(5000);

    const result = await compressImage(file, { targetBytes: 500 });

    expect(recording.toBlobCalls.map((call) => call.quality)).toEqual([0.85, 0.7]);
    expect(result.size).toBe(300);
    expect(result.name).toBe("photo.webp");
    expect(result.type).toBe("image/webp");
  });

  it("returns the lowest rung when the ladder is exhausted without fitting", async () => {
    stubDecoder(1000, 1000);
    const recording = stubCanvas(() => blobOf(900, "image/webp"));
    const file = makeFile(5000);

    const result = await compressImage(file, { targetBytes: 500 });

    expect(recording.toBlobCalls.map((call) => call.quality)).toEqual([0.85, 0.7, 0.55, 0.4]);
    expect(result.size).toBe(900);
  });

  it("keeps names without extensions and reuses the original base", async () => {
    stubDecoder(1000, 1000);
    stubCanvas((_mime, quality) => blobOf(quality === 0.85 ? 50 : 900, "image/webp"));
    const file = makeFile(5000, "signature");

    const result = await compressImage(file, { targetBytes: 100 });

    expect(result.name).toBe("signature.webp");
  });

  it("paints the backdrop before drawing when a background is requested", async () => {
    stubDecoder(1000, 1000);
    const recording = stubCanvas(() => blobOf(50, "image/webp"));
    const file = makeFile(5000);

    await compressImage(file, { targetBytes: 100, background: "#ffffff" });

    expect(recording.filledRects).toBe(1);
  });
});

describe("compressImage — WebP → JPEG fallback", () => {
  it("falls back to JPEG with the same ladder when WebP encoding is unsupported", async () => {
    stubDecoder(1000, 1000);
    const recording = stubCanvas((mime) => (mime === "image/webp" ? null : blobOf(300, mime)));
    const file = makeFile(5000);

    const result = await compressImage(file, { targetBytes: 500 });

    expect(recording.toBlobCalls.map((call) => call.mime)).toEqual(["image/webp", "image/jpeg"]);
    expect(result.name).toBe("photo.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(300);
  });

  it("throws when neither WebP nor JPEG encoding is available", async () => {
    stubDecoder(1000, 1000);
    stubCanvas(() => null);
    const file = makeFile(5000);

    await expect(compressImage(file, { targetBytes: 500 })).rejects.toThrow(
      "image encoding failed"
    );
  });
});

describe("compressImage — decode failure", () => {
  it("rejects when the source cannot be decoded by any path", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decoder unavailable");
      })
    );
    // <img> fallback: stub the object URL and a broken Image so onerror fires
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:broken");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    class BrokenImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("Image", BrokenImage);
    const file = makeFile(5000);

    await expect(compressImage(file)).rejects.toThrow("image decode failed");
  });
});

describe("prepareImageForUpload — surface guard", () => {
  it("rejects originals over 20MB before decoding", async () => {
    const decoder = vi.fn();
    vi.stubGlobal("createImageBitmap", decoder);

    const result = await prepareImageForUpload(makeFile(IMAGE_UPLOAD_MAX_INPUT_BYTES + 1));

    expect(result).toEqual({ ok: false, reason: "input-too-large" });
    expect(decoder).not.toHaveBeenCalled();
  });

  it("accepts an original exactly at the 20MB cap", async () => {
    stubDecoder(1000, 1000);
    stubCanvas(() => blobOf(300, "image/webp"));

    const result = await prepareImageForUpload(makeFile(IMAGE_UPLOAD_MAX_INPUT_BYTES));

    expect(result).toEqual({ ok: true, file: expect.any(File) });
  });

  it("rejects output still over the 2MB stored cap after compression", async () => {
    stubDecoder(4000, 4000);
    stubCanvas(() => blobOf(IMAGE_STORED_MAX_BYTES + 1, "image/webp"));

    const result = await prepareImageForUpload(makeFile(5000));

    expect(result).toEqual({ ok: false, reason: "stored-too-large" });
  });

  it("maps decode failures to a decode-failed result instead of throwing", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decoder unavailable");
      })
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:broken");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    class BrokenImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("Image", BrokenImage);

    const result = await prepareImageForUpload(makeFile(5000));

    expect(result).toEqual({ ok: false, reason: "decode-failed" });
  });

  it("returns the compressed WebP file on success", async () => {
    stubDecoder(4000, 3000);
    stubCanvas((_mime, quality) => blobOf(quality === 0.85 ? 9000 : 250, "image/webp"));

    const result = await prepareImageForUpload(makeFile(12000), { targetBytes: 500 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.name).toBe("photo.webp");
      expect(result.file.size).toBe(250);
    }
  });
});
