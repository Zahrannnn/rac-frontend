import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** The manifest is a committed static asset (public/); test its contract. */
function loadManifest(): Record<string, unknown> {
  const file = path.resolve(process.cwd(), "public", "manifest.webmanifest");
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

function iconFor(manifest: Record<string, unknown>, sizes: string, purpose: string) {
  const icons = manifest.icons as Array<Record<string, string>>;
  return icons.find(
    (icon) => icon.sizes === sizes && (icon.purpose ?? "any") === purpose && icon.type === "image/png"
  );
}

describe("PWA web app manifest", () => {
  const manifest = loadManifest();

  it("carries the bilingual app name and a short install label", () => {
    expect(manifest.name).toMatch(/RAC-DAMP/);
    expect(manifest.name).toMatch(/[\u0600-\u06FF]/); // Arabic name present
    expect(manifest.short_name).toBe("RAC-DAMP");
  });

  it("declares the RTL Arabic standalone app shell", () => {
    expect(manifest.dir).toBe("rtl");
    expect(manifest.lang).toBe("ar");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
  });

  it("uses the navy shell color for theme and background", () => {
    expect(manifest.theme_color).toBe("#004E77");
    expect(manifest.background_color).toBe("#004E77");
  });

  it("ships any-purpose 192/512 icons plus maskable variants", () => {
    for (const sizes of ["192x192", "512x512"]) {
      expect(iconFor(manifest, sizes, "any"), `any ${sizes}`).toBeDefined();
      expect(iconFor(manifest, sizes, "maskable"), `maskable ${sizes}`).toBeDefined();
    }

    // Every referenced icon must exist as a committed file next to the manifest.
    const icons = manifest.icons as Array<Record<string, string>>;
    expect(icons.length).toBeGreaterThanOrEqual(4);
    for (const icon of icons) {
      const file = path.resolve(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(() => readFileSync(file), icon.src).not.toThrow();
    }
  });
});
