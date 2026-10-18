import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkshopDeleteCard } from "./WorkshopDeleteCard";
import { I18nProvider } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";
import type { Workshop } from "../types";

const mutateDelete = vi.fn();
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("../hooks/use-workshops", () => ({
  useDeleteWorkshop: () => ({ mutate: mutateDelete, isPending: false }),
}));

function workshopFixture(status: Workshop["status"]): Workshop {
  return {
    id: "w-1",
    code: "MAC-CAR-000125",
    status,
  } as unknown as Workshop;
}

function renderCard(status: Workshop["status"], canDelete: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <WorkshopDeleteCard workshop={workshopFixture(status)} canDelete={canDelete} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("WorkshopDeleteCard", () => {
  beforeEach(() => {
    mutateDelete.mockClear();
    routerPush.mockClear();
  });

  it("renders nothing without the delete permission or outside Draft", () => {
    const { container: noPermission } = renderCard("Draft", false);
    expect(noPermission).toBeEmptyDOMElement();

    const { container: notDraft } = renderCard("Submitted", true);
    expect(notDraft).toBeEmptyDOMElement();
  });

  it("keeps the confirm disabled until the workshop code is typed exactly", async () => {
    renderCard("Draft", true);

    fireEvent.click(await screen.findByRole("button", { name: /حذف الورشة/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/لا يمكن التراجع عن هذا الإجراء/);

    const confirm = within(dialog).getByRole("button", { name: /حذف الورشة/ });
    expect(confirm).toBeDisabled();

    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "MAC-CAR-00012" },
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "MAC-CAR-000125" },
    });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    await waitFor(() =>
      expect(mutateDelete).toHaveBeenCalledWith("w-1", expect.any(Object))
    );
  });

  it("navigates back to the registry after a successful delete", async () => {
    renderCard("Draft", true);

    fireEvent.click(await screen.findByRole("button", { name: /حذف الورشة/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "MAC-CAR-000125" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /حذف الورشة/ }));

    await waitFor(() => expect(mutateDelete).toHaveBeenCalled());
    mutateDelete.mock.calls[0]![1]!.onSuccess();
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith(routes.workshops));
  });
});
