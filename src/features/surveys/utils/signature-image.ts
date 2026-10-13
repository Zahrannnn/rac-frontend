/**
 * Closing-signature image pipeline (questionnaire Ver3): the surveyor
 * photographs the wet signature and the browser downscales/compresses it to a
 * JPEG data URL that fits the stored-answers budget (≤512KB target, ~700KB
 * hard ceiling — the backend stores answers as opaque JSON).
 */

/** Target ceiling per signature image, mirroring the 512KB photo limit. */
export const SIGNATURE_MAX_BYTES = 512 * 1024;

/** Longest allowed side of the compressed signature image. */
const MAX_SIDE = 1200;

/** JPEG quality ladder — first rung that fits the budget wins. */
const QUALITY_LADDER = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];

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

function drawToCanvas(source: ImageBitmap | HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas 2d context unavailable");
  }
  // white backdrop so transparent PNG signatures read correctly as JPEG
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function encodeWithinBudget(canvas: HTMLCanvasElement): string {
  let output = canvas.toDataURL("image/jpeg", QUALITY_LADDER[QUALITY_LADDER.length - 1]);
  for (const quality of QUALITY_LADDER) {
    output = canvas.toDataURL("image/jpeg", quality);
    if (fitsSignatureBudget(output)) {
      return output;
    }
  }
  return output; // best rung — caller may still reject if over the hard ceiling
}

/**
 * Compress an image File (camera capture or gallery pick) into a JPEG data URL
 * scaled down to MAX_SIDE and quality-stepped until it fits SIGNATURE_MAX_BYTES.
 * Throws when the source cannot be decoded or no canvas context is available.
 */
export async function compressSignatureImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = drawToCanvas(
      bitmap,
      Math.max(1, Math.round(bitmap.width * scale)),
      Math.max(1, Math.round(bitmap.height * scale))
    );
    const output = encodeWithinBudget(canvas);
    if (fitsSignatureBudget(output)) {
      return output;
    }
    // pathological aspect ratios: halve once more before giving up
    const smaller = drawToCanvas(bitmap, Math.round(canvas.width / 2), Math.round(canvas.height / 2));
    return encodeWithinBudget(smaller);
  } finally {
    bitmap.close();
  }
}
