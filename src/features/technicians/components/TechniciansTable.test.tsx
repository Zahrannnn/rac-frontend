import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { Technician } from "../types";
import { TechniciansTable } from "./TechniciansTable";

const technician: Technician = {
  id: "t1",
  fullName: "Ahmed Ali",
  fullNameAr: "أحمد علي",
  mobile: "01012345678",
  workshopId: "w1",
  workshopCode: "RAC-CAR-000125",
  specialty: "AC repair",
  yearsOfExperience: 7,
  status: "Active",
  notes: null,
  gender: null,
  age: null,
  employmentType: null,
  employmentNature: null,
  hasModernRefrigerantExperience: null,
  employer: null,
  address: null,
  createdAtUtc: "2026-01-01T00:00:00Z",
};

const freeTechnician: Technician = {
  id: "t-free",
  fullName: "Free Tech",
  fullNameAr: "فني حر",
  mobile: "01099999999",
  workshopId: null,
  workshopCode: null,
  specialty: null,
  yearsOfExperience: 2,
  status: "Active",
  notes: null,
  gender: null,
  age: null,
  employmentType: null,
  employmentNature: null,
  hasModernRefrigerantExperience: null,
  employer: null,
  address: null,
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
  it("renders through the shared DataTable with no national-ID column (2026-11-17)", () => {
    renderTable();

    const table = screen.getByRole("table", { name: "الفنيون" });
    expect(within(table).getByText("أحمد علي")).toBeInTheDocument();
    expect(within(table).getByText("RAC-CAR-000125")).toBeInTheDocument();
    expect(within(table).getByText("01012345678")).toBeInTheDocument();
    // The National ID column is GONE (2026-11-17 NatID removal).
    expect(within(table).queryByText("الرقم القومي")).not.toBeInTheDocument();
  });

  it("shows the technicians empty state when there are no rows", () => {
    renderTable([]);

    expect(screen.getByRole("table", { name: "الفنيون" })).toBeInTheDocument();
    expect(screen.getByText("لا يوجد فنيون")).toBeInTheDocument();
  });

  it("renders a free technician with the بدون ورشة chip instead of a workshop code", () => {
    renderTable([technician, freeTechnician]);

    const table = screen.getByRole("table", { name: "الفنيون" });
    expect(within(table).getByText("فني حر")).toBeInTheDocument();
    expect(within(table).getByText("بدون ورشة")).toBeInTheDocument();
    expect(within(table).getByText("RAC-CAR-000125")).toBeInTheDocument();
  });
});
