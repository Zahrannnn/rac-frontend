import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      username: "admin",
      fullName: "Super Admin",
      permissions: ["*"],
    },
  }),
  can: () => true,
}));

type WorkshopsResult = {
  data?: { items: Workshop[]; totalCount: number; pageSize: number; page: number };
  isPending: boolean;
  isPlaceholderData: boolean;
  isError: boolean;
  refetch: Mock;
};

let workshopsResult: WorkshopsResult | undefined;

vi.mock("../hooks/use-workshops", () => ({
  useWorkshops: () => workshopsResult,
}));

import { I18nProvider } from "@/shared/i18n";
import type { Workshop } from "../types";
import { WorkshopsPage } from "./WorkshopsPage";

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

function loaded(items: Workshop[]): WorkshopsResult {
  return {
    data: { items, totalCount: items.length, pageSize: 10, page: 1 },
    isPending: false,
    isPlaceholderData: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function renderPage() {
  return render(
    <I18nProvider>
      <WorkshopsPage />
    </I18nProvider>
  );
}

describe("WorkshopsPage list", () => {
  beforeEach(() => {
    workshopsResult = undefined;
  });

  it("renders the registry through the shared DataTable", () => {
    workshopsResult = loaded([workshop]);
    renderPage();

    const table = screen.getByRole("table", {
      name: "الورش - مراكز خدمة تكييف السيارات",
    });
    expect(within(table).getByText("RAC-CAR-000125")).toBeInTheDocument();
    expect(within(table).getByText("ورشة نصر")).toBeInTheDocument();
  });

  it("shows the feature empty state when the page has no workshops", () => {
    workshopsResult = loaded([]);
    renderPage();

    expect(
      screen.getByRole("table", { name: "الورش - مراكز خدمة تكييف السيارات" })
    ).toBeInTheDocument();
    expect(screen.getByText("لا توجد ورش مطابقة")).toBeInTheDocument();
    expect(
      screen.getByText("جرّب تعديل عوامل التصفية أو سجّل ورشة جديدة.")
    ).toBeInTheDocument();
  });
});
