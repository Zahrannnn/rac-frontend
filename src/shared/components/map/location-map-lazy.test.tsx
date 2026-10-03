import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";

// Crash the real map module — the lazy wrapper must degrade to its fallback.
vi.mock("./location-map", () => ({
  default: function CrashingMap(): never {
    throw new Error("Map container is being reused by another instance");
  },
}));

import { LocationMapLazy } from "./location-map-lazy";

describe("LocationMapLazy crash isolation", () => {
  it("renders the unavailable fallback instead of unwinding the page", async () => {
    render(
      <I18nProvider>
        <LocationMapLazy lat={30} lon={31} height={220} />
      </I18nProvider>
    );

    // the dynamic module resolves async — the fallback appears once it throws
    await waitFor(() =>
      expect(screen.getByText("الخريطة غير متاحة الآن")).toBeInTheDocument()
    );
  });
});
