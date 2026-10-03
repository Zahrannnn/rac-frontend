/**
 * One-shot PWA icon generator for RAC-DAMP.
 *
 * Reads the brand logo (public/brand/rac-damp-logo.png) and writes the icons
 * referenced by public/manifest.webmanifest + the layout metadata:
 *
 *   public/icons/icon-192.png           plain, 192×192
 *   public/icons/icon-512.png           plain, 512×512
 *   public/icons/icon-maskable-192.png  logo on solid #004E77, 192×192
 *   public/icons/icon-maskable-512.png  logo on solid #004E77, 512×512
 *   public/icons/apple-touch-icon.png   logo on solid #004E77, 180×180
 *
 * The generated PNGs are COMMITTED — the CI/CD pipeline never runs this script.
 * Re-run by hand only when the brand logo changes:
 *
 *   npm run icons:generate
 *
 * Requires the `sharp` dev dependency (install with `npm install`).
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(repoRoot, "public", "brand", "rac-damp-logo.png");
const OUT_DIR = path.join(repoRoot, "public", "icons");

// DESIGN.md shell navy — the PWA theme color and the padded-icon background.
const NAVY = { r: 0x00, g: 0x4e, b: 0x77, alpha: 1 };

// The source asset is a 1024×1024 JPEG (despite the .png extension): a rounded
// blue tile with ~170px corner radii on an opaque white canvas. Cropping 64px
// inset on every side clears the white corner regions so no icon ever shows
// white fringes.
const TILE = { left: 64, top: 64, width: 1024 - 2 * 64, height: 1024 - 2 * 64 };

// Maskable safe zone: Android masks to shapes as small as a circle of radius
// 40% of the canvas. A centered square fits fully inside at ≤ 56.6% of the
// canvas; 58% keeps the logo's visible ink (rounded tile, inset snowflake)
// within the safe circle while staying as large as possible.
const MASKABLE_RATIO = 0.58;
// iOS only rounds the canvas corners itself, so the logo can sit larger.
const APPLE_RATIO = 0.72;
const APPLE_SIZE = 180;

/** The brand tile (white corners cropped away) resized to `size`², as PNG. */
function brandTile(size) {
  return sharp(SOURCE)
    .extract(TILE)
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();
}

/** Logo centered on a solid #004E77 square, scaled to `ratio` of the canvas. */
async function paddedIcon(fileName, size, ratio) {
  const inner = Math.round(size * ratio);
  const tile = await brandTile(inner);
  await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: tile, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, fileName));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Plain icons: the brand tile itself, full-bleed.
  for (const size of [192, 512]) {
    await sharp(SOURCE)
      .extract(TILE)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }

  // Maskable variants: logo on the navy shell color, safe-zone padded.
  for (const size of [192, 512]) {
    await paddedIcon(`icon-maskable-${size}.png`, size, MASKABLE_RATIO);
    console.log(`✓ icon-maskable-${size}.png`);
  }

  // Apple home-screen icon (iOS renders no transparency — solid background).
  await paddedIcon("apple-touch-icon.png", APPLE_SIZE, APPLE_RATIO);
  console.log("✓ apple-touch-icon.png");
}

main().catch((error) => {
  console.error("icon generation failed:", error);
  process.exitCode = 1;
});
