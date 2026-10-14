import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { Technician } from "../types";
import { TechniciansTable } from "./TechniciansTable";

const technician: Technician = {
  id: "t1",
  fullName: "Ahmed Ali",
  fullNameAr: "أحمد علي",
  nationalId: null,
  mobile: "01012345678",
  workshopId: "w1",
  workshopCode: "RAC-CAR-000125",
  specialty: "AC repair",
  yearsOfExperience: 7,
  status: "Active",
  notes: null,
  createdAtUtc: "2026-01-01T00:00:00Z",
};

function renderTable(technicians: Technician[] = [technician]) {
  return render(
    <I18nProvider>
      <TechniciansTable technicians={technicians} onOpen={vi.fn()} />
    </I18nProvider>
  );
}

describe("TechniciansTable", () => {
  it("renders through the shared DataTable with the missing-national-id fallback", () => {
    renderTable();

    const table = screen.getByRole("table", { name: "الفنيون" });
    expect(within(table).getByText("أحمد علي")).toBeInTheDocument();
    expect(within(table).getByText("RAC-CAR-000125")).toBeInTheDocument();
    expect(within(table).getByText("—")).toBeInTheDocument();
  });

  it("shows the technicians empty state when there are no rows", () => {
    renderTable([]);

    expect(screen.getByRole("table", { name: "الفنيون" })).toBeInTheDocument();
    expect(screen.getByText("لا يوجد فنيون")).toBeInTheDocument();
  });
});
