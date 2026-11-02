import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusActions } from "./StatusActions";
import { I18nProvider } from "@/shared/i18n";
import type { Workshop } from "../types";

const mutateUpdate = vi.fn();

vi.mock("../hooks/use-workshops", () => ({
  useUpdateWorkshop: () => ({ mutate: mutateUpdate, isPending: false }),
}));

function workshopFixture(status: Workshop["status"]): Workshop {
  return {
    id: "w-1",
    code: "MAC-CAR-000125",
    status,
  } as unknown as Workshop;
}

function renderActions(status: Workshop["status"]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StatusActions workshop={workshopFixture(status)} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("StatusActions", () => {
  beforeEach(() => {
    mutateUpdate.mockClear();
  });

  it("offers a Completed workshop the reopen-to-submitted transition", () => {
    renderActions("Complete");

    // 2026-11 reopen decision: Complete is no longer terminal — the profile
    // shows the reopen button, not the awaiting-scoring note.
    expect(screen.getByRole("button", { name: "إعادة فتح للتصحيح" })).toBeTruthy();
    expect(screen.queryByText(/استبيان الورشة مكتمل/)).toBeNull();
  });

  it("reopens through the confirm dialog with status Submitted", () => {
    renderActions("Complete");

    fireEvent.click(screen.getByRole("button", { name: "إعادة فتح للتصحيح" }));
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    expect(mutateUpdate).toHaveBeenCalledWith(
      { status: "Submitted", confirmDuplicate: false },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
