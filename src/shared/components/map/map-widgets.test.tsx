import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";

/**
 * The fullscreen handler re-measures the map 60ms after the browser's
 * fullscreenchange event. Navigating away inside that window used to fire
 * `invalidateSize` on the REMOVED map — Leaflet re-measured the detached
 * container as NaN and threw the uncaught "Invalid LatLng object: (NaN, NaN)"
 * that killed the router transition. These pins guard the fix: the timer is
 * cancelled on unmount and a detached container is never re-measured.
 */

const container = document.createElement("div");
document.body.appendChild(container);

const fakeMap = {
  getContainer: () => container,
  stop: vi.fn(),
  invalidateSize: vi.fn(),
};

vi.mock("react-leaflet", () => ({
  useMap: () => fakeMap,
}));

vi.mock("leaflet", () => ({
  default: {
    DomEvent: { disableClickPropagation: vi.fn() },
  },
}));

import { MapToolbar } from "./map-widgets";

function renderToolbar() {
  return render(
    <I18nProvider>
      <MapToolbar />
    </I18nProvider>
  );
}

function fireFullscreenChange() {
  act(() => {
    document.dispatchEvent(new Event("fullscreenchange"));
  });
}

describe("MapToolbar fullscreen re-measure", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fakeMap.stop.mockClear();
    fakeMap.invalidateSize.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-measures once the browser settles, stopping animations first", () => {
    renderToolbar();

    fireFullscreenChange();
    expect(fakeMap.invalidateSize).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(fakeMap.stop).toHaveBeenCalledTimes(1);
    expect(fakeMap.invalidateSize).toHaveBeenCalledTimes(1);
  });

  it("never touches the map after unmount (the Invalid-LatLng NaN crash)", () => {
    const { unmount } = renderToolbar();

    // Exit fullscreen, then navigate away within the 60ms window.
    fireFullscreenChange();
    unmount();
    // The browser's exit event still lands afterwards — and must be ignored.
    fireFullscreenChange();
    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(fakeMap.invalidateSize).not.toHaveBeenCalled();
    expect(fakeMap.stop).not.toHaveBeenCalled();
  });
});
