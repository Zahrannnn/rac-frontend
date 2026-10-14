/**
 * Closing-signature image pipeline (questionnaire Ver3): the surveyor
 * photographs the wet signature and the browser compresses it through the
 * shared canvas pipeline into a WebP data URL (JPEG fallback) that fits the
 * stored-answers budget (≤400KB — the backend stores answers as opaque JSON).
 * EXIF is stripped by the canvas re-encode; tiny, small-dimension originals
 * are kept as-is (the shared util's no-loss fast path).
 */
import { compressImage } from "@/shared/utils/image-compression";

/** Stored-signature budget per image inside the stored-answers JSON. */
export const SIGNATURE_MAX_BYTES = 400 * 1024;

/** Longest allowed side — signatures are fine detail, tighter than photos. */
const SIGNATURE_MAX_SIDE = 1200;

/** Shared-util options for the signature pass (white backdrop for JPEG fallback). */
const SIGNATURE_OPTIONS = {
  maxSide: SIGNATURE_MAX_SIDE,
  targetBytes: SIGNATURE_MAX_BYTES,
  background: "#ffffff",
} as const;

/** Decoded byte size of a base64 data URL (payload after the comma). */
export function dataUrlBytes(dataUrl: string): number {
  const payload = dataUrl.slice(dataUrl.indexOf(",") + 1);
  // 4 base64 chars → 3 bytes; padding-aware
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

/** A data URL fits the stored-signature budget. */
export function fitsSignatureBudget(dataUrl: string): boolean {
  return dataUrlBytes(dataUrl) <= SIGNATURE_MAX_BYTES;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("signature encoding failed"));
    reader.readAsDataURL(blob);
  });
}

async function toSignatureDataUrl(file: File): Promise<string> {
  const dataUrl = await blobToDataUrl(file);
  if (!fitsSignatureBudget(dataUrl)) {
    throw new Error("signature exceeds the stored-answers budget");
  }
  return dataUrl;
}

/**
 * Compress an image File (camera capture or gallery pick) into a WebP data
 * URL scaled to 1200px and quality-stepped until it fits SIGNATURE_MAX_BYTES;
 * a second, half-size pass covers pathological aspect ratios. Throws when the
 * source cannot be decoded or the budget still cannot be met.
 */
export async function compressSignatureImage(file: File): Promise<string> {
  const compressed = await compressImage(file, SIGNATURE_OPTIONS);
  if (compressed.size <= SIGNATURE_MAX_BYTES) {
    return toSignatureDataUrl(compressed);
  }
  // pathological aspect ratios: halve once more before giving up
  const smaller = await compressImage(compressed, {
    ...SIGNATURE_OPTIONS,
    maxSide: Math.round(SIGNATURE_MAX_SIDE / 2),
  });
  return toSignatureDataUrl(smaller);
}
