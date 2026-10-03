import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/shared/components/map", () => ({
  LocationMapLazy: ({ lat, lon }: { lat: number; lon: number }) => (
    <div data-testid="map">
      {lat},{lon}
    </div>
  ),
}));

const mutate = vi.fn();

vi.mock("../hooks/use-workshops", () => ({
  useUpdateWorkshop: () => ({ mutate, isPending: false }),
}));

import { LocationCard } from "./LocationCard";
import { I18nProvider } from "@/shared/i18n";

function renderCard(props?: { latitude?: number | null; longitude?: number | null; canEdit?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <LocationCard
          workshopId="w-1"
          latitude={props?.latitude ?? null}
          longitude={props?.longitude ?? null}
          label="ورشة نصر"
          canEdit={props?.canEdit ?? true}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("LocationCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mutate.mockClear();
  });

  it("lets an editor enter coordinates and save", async () => {
    renderCard({ canEdit: true });

    fireEvent.change(screen.getByLabelText(/خط العرض|Latitude/i), {
      target: { value: "30.0444" },
    });
    fireEvent.change(screen.getByLabelText(/خط الطول|Longitude/i), {
      target: { value: "31.2357" },
    });

    expect(await screen.findByTestId("map")).toHaveTextContent("30.0444,31.2357");

    fireEvent.click(screen.getByRole("button", { name: /حفظ الموقع|Save location/i }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { latitude: 30.0444, longitude: 31.2357, confirmDuplicate: false },
        expect.any(Object)
      )
    );
  });

  it("hides the editor when canEdit is false", () => {
    renderCard({ canEdit: false });
    expect(screen.queryByRole("button", { name: /التقط GPS|Capture GPS/i })).not.toBeInTheDocument();
    expect(screen.getByText(/لا توجد إحداثيات|No coordinates/i)).toBeInTheDocument();
  });
});
