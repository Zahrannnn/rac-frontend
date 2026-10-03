import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let params = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}));

import { useDashboardUrlFilters } from "./use-dashboard-url-filters";

function mount() {
  return renderHook(() => useDashboardUrlFilters());
}

beforeEach(() => {
  replace.mockClear();
  params = new URLSearchParams("");
});

describe("useDashboardUrlFilters", () => {
  it("derives filters from the URL without navigating on mount", () => {
    params = new URLSearchParams("governorate=Cairo&status=Draft");

    const { result } = mount();

    expect(result.current.filters.governorate).toBe("Cairo");
    expect(result.current.filters.status).toBe("Draft");
    // The regression: the old mount-effect router.replace re-fetched the RSC
    // payload, suspended the Suspense boundary, remounted the page and looped.
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to defaults for a clean URL and still does not navigate", () => {
    const { result } = mount();

    expect(result.current.filters).toEqual({
      governorate: "all",
      district: "all",
      status: "all",
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates with the serialized query when a filter changes", () => {
    const { result } = mount();

    act(() => {
      result.current.setFilters({ governorate: "Cairo", district: "all", status: "all" });
    });

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("?governorate=Cairo", { scroll: false });
  });

  it("navigates to the bare pathname when every filter resets to default", () => {
    const { result } = mount();

    act(() => {
      result.current.setFilters({ governorate: "all", district: "all", status: "all" });
    });

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(window.location.pathname, { scroll: false });
  });
});
