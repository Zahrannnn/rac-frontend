/**
 * Client-side image compression shared by every upload surface (survey
 * documentation photos, training photos, delivery photos, signature capture).
 *
 * Pipeline: decode (createImageBitmap, `<img>` + object URL fallback for old
 * Safari) → downscale so the longest side ≤ `maxSide` → WebP re-encode through
 * a quality ladder (0.85 → 0.7 → 0.55 → 0.4) until the blob fits `targetBytes`
 * or the ladder ends; JPEG is the fallback when WebP encoding is unsupported.
 *
 * Privacy: re-encoding through the canvas strips EXIF metadata (GPS coords,
 * device identifiers, capture timestamps) by construction — field evidence
 * carries only the app's explicit GPS + user + timestamp capture, never the
 * camera's.
 */

/** Largest ORIGINAL file accepted from the field — rejected before decode. */
export const IMAGE_UPLOAD_MAX_INPUT_BYTES = 20 * 1024 * 1024;

/** Largest STORED image allowed after compression (backend mirror). */
export const IMAGE_STORED_MAX_BYTES = 2 * 1024 * 1024;

/** Longest allowed side of the compressed output. */
const DEFAULT_MAX_SIDE = 2048;

/** Encoding budget — the first ladder rung that fits wins. */
const DEFAULT_TARGET_BYTES = 400 * 1024;

/** WebP/JPEG quality ladder, stepped down until the blob fits the budget. */
const DEFAULT_QUALITY_LADDER = [0.85, 0.7, 0.55, 0.4];

export interface CompressImageOptions {
  /** Longest allowed side in px (default 2048; signatures use 1200). */
  maxSide?: number;
  /** Stop the ladder once the blob is ≤ this size (default 400KB). */
  targetBytes?: number;
  /** Qualities tried in order (default 0.85 → 0.4). */
  qualityLadder?: number[];
  /** Backdrop fill (e.g. "#ffffff") for opaque output from transparent sources. */
  background?: string;
}

/** Why an image was refused by {@link prepareImageForUpload}. */
export type PrepareImageFailureReason =
  | "input-too-large" // original over IMAGE_UPLOAD_MAX_INPUT_BYTES (20MB)
  | "stored-too-large" // still over IMAGE_STORED_MAX_BYTES (2MB) after compression
  | "decode-failed"; // source could not be decoded or encoded

export type PrepareImageResult =
  | { ok: true; file: File }
  | { ok: false; reason: PrepareImageFailureReason };

interface DecodedImage {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  release: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // undecodable via bitmap (e.g. old Safari) — fall through to <img>
    }
  }
  return decodeViaImgElement(file);
}

function decodeViaImgElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const release = () => URL.revokeObjectURL(url);
    image.onload = () =>
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release,
      });
    image.onerror = () => {
      release();
      reject(new Error("image decode failed"));
    };
    image.src = url;
  });
}

function drawScaled(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  background?: string
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas 2d context unavailable");
  }
  if (background) {
    // opaque backdrop so transparent sources read correctly after re-encode
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

/**
 * Encode the canvas through the quality ladder. WebP first; when the browser
 * cannot encode WebP (`toBlob` yields null) the same ladder runs in JPEG.
 * Returns the first rung that fits `targetBytes`, or the last (lowest) rung.
 */
async function encodeWithinBudget(
  canvas: HTMLCanvasElement,
  ladder: number[],
  targetBytes: number
): Promise<{ blob: Blob; mime: "image/webp" | "image/jpeg" }> {
  let mime: "image/webp" | "image/jpeg" = "image/webp";
  let blob = await canvasToBlob(canvas, mime, ladder[0]);
  if (blob === null) {
    mime = "image/jpeg"; // WebP unsupported — same ladder in JPEG
    blob = await canvasToBlob(canvas, mime, ladder[0]);
  }
  if (blob === null) {
    throw new Error("image encoding failed");
  }
  // blob holds ladder rung 0 — keep stepping down until it fits the budget
  for (let index = 1; index < ladder.length; index += 1) {
    if (blob.size <= targetBytes) {
      break;
    }
    const rung = await canvasToBlob(canvas, mime, ladder[index]);
    if (rung === null) {
      throw new Error("image encoding failed");
    }
    blob = rung;
  }
  return { blob, mime };
}

function outputName(originalName: string, extension: string): string {
  const dot = originalName.lastIndexOf(".");
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}.${extension}`;
}

/**
 * Compress an image File for storage: decode, downscale to `maxSide` on the
 * longest side, WebP-encode down the quality ladder until `targetBytes` is
 * met (JPEG fallback). EXIF is stripped by the canvas re-encode. A tiny
 * original (≤ `targetBytes` AND ≤ `maxSide` on its longest side) is returned
 * unchanged — no quality loss for files that already fit. Throws when the
 * source cannot be decoded or no encoder is available.
 */
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const maxSide = options.maxSide ?? DEFAULT_MAX_SIDE;
  const targetBytes = options.targetBytes ?? DEFAULT_TARGET_BYTES;
  const ladder = options.qualityLadder ?? DEFAULT_QUALITY_LADDER;

  const decoded = await decodeImage(file);
  try {
    // already tiny and small-dimension: keep the original bytes untouched
    if (file.size <= targetBytes && Math.max(decoded.width, decoded.height) <= maxSide) {
      return file;
    }
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = drawScaled(decoded.source, width, height, options.background);
    const { blob, mime } = await encodeWithinBudget(canvas, ladder, targetBytes);
    const extension = mime === "image/webp" ? "webp" : "jpg";
    return new File([blob], outputName(file.name, extension), {
      type: mime,
      lastModified: Date.now(),
    });
  } finally {
    decoded.release();
  }
}

/**
 * Upload-surface guard used by every photo picker: reject originals over the
 * 20MB input cap before decoding, compress via {@link compressImage}, then
 * enforce the 2MB stored cap on the result — all without throwing.
 */
export async function prepareImageForUpload(
  file: File,
  options: CompressImageOptions = {}
): Promise<PrepareImageResult> {
  if (file.size > IMAGE_UPLOAD_MAX_INPUT_BYTES) {
    return { ok: false, reason: "input-too-large" };
  }
  let compressed: File;
  try {
    compressed = await compressImage(file, options);
  } catch {
    return { ok: false, reason: "decode-failed" };
  }
  if (compressed.size > IMAGE_STORED_MAX_BYTES) {
    return { ok: false, reason: "stored-too-large" };
  }
  return { ok: true, file: compressed };
}
