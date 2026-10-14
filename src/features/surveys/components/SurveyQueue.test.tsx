import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { Workshop } from "@/features/workshops/types";
import { SurveyQueue } from "./SurveyQueue";

const workshop: Workshop = {
  id: "w1",
  code: "RAC-CAR-000125",
  nameEn: "Nasr Workshop",
  nameAr: "ورشة نصر",
  ownerName: "Samir",
  mobile: "01012345678",
  telephone: null,
  address: "1 Tahrir Sq",
  governorate: "Cairo",
  district: null,
  type: "Independent",
  status: "Draft",
  flags: "None",
  activities: null,
  numberOfTechnicians: null,
  latitude: null,
  longitude: null,
  notes: null,
  createdAtUtc: "2026-01-01T00:00:00Z",
  updatedAtUtc: null,
};

function renderQueue(rows: Workshop[] = [workshop]) {
  const openWizard = vi.fn();
  render(
    <I18nProvider>
      <SurveyQueue rows={rows} surveysMap={new Map()} openWizard={openWizard} />
    </I18nProvider>
  );
  return { openWizard };
}

describe("SurveyQueue", () => {
  it("renders the queue through the shared DataTable and opens the wizard from a row", () => {
    const { openWizard } = renderQueue();

    const table = screen.getByRole("table", { name: "الاستبيانات" });
    expect(within(table).getByText("RAC-CAR-000125")).toBeInTheDocument();
    expect(within(table).getByText("بدء الاستبيان")).toBeInTheDocument();

    fireEvent.click(within(table).getAllByRole("row")[1]);
    expect(openWizard).toHaveBeenCalledWith("w1");
  });

  it("shows the queue empty state when there are no rows", () => {
    renderQueue([]);

    expect(screen.getByRole("table", { name: "الاستبيانات" })).toBeInTheDocument();
    expect(screen.getByText("لا توجد ورش بعد")).toBeInTheDocument();
  });
});
