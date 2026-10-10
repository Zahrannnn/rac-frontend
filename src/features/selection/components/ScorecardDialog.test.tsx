import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { ScorecardResponse } from "../types";

const { useScorecardMock } = vi.hoisted(() => ({
  useScorecardMock: vi.fn(),
}));

vi.mock("../hooks/use-selection", () => ({
  useScorecard: useScorecardMock,
}));

import { ScorecardDialog } from "./ScorecardDialog";

const scorecard: ScorecardResponse = {
  workshopId: "00000000-0000-0000-0000-000000000042",
  kind: "participation",
  rubricVersion: "participation-v1",
  total: 8,
  maxTotal: 100,
  computedAtUtc: "2026-10-10T12:00:00Z",
  criteria: [
    {
      key: "legal_status",
      labelKey: "rubric.participation.legal_status",
      points: 5,
      maxPoints: 5,
      bandLabelKey: "rubric.band.legal_full",
      source: {
        sectionKey: "basicInfo",
        fieldKey: "legalStatus",
        displayValue: "registered",
      },
    },
    {
      key: "ownership",
      labelKey: "rubric.participation.ownership",
      points: 3,
      maxPoints: 10,
      bandLabelKey: "rubric.band.ownership_male",
      source: {
        sectionKey: "basicInfo",
        fieldKey: "ownership",
        displayValue: "male",
      },
    },
    {
      key: "avg_vehicles_monthly",
      labelKey: "rubric.participation.avg_vehicles_monthly",
      points: 0,
      maxPoints: 15,
      bandLabelKey: "rubric.band.none",
      source: { sectionKey: "workforce", fieldKey: "carsPerMonth", displayValue: null },
    },
  ],
};

function renderDialog(props: Partial<Parameters<typeof ScorecardDialog>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ScorecardDialog
          workshopId="w-1"
          kind="participation"
          workshopLabel="RAC-CAR-000042 — ورشة الاختبار"
          onOpenChange={vi.fn()}
          {...props}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("ScorecardDialog", () => {
  it("renders one traceability row per criterion: label, raw answer, band, points", async () => {
    useScorecardMock.mockReturnValue({
      data: scorecard,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    renderDialog();

    // Criterion labels (Arabic default locale).
    expect(await screen.findByText("الوضع القانوني للورشة")).toBeInTheDocument();
    expect(screen.getByText("ملكية الورشة")).toBeInTheDocument();

    // Raw stored answers, monospace-styled.
    expect(screen.getByText("registered")).toBeInTheDocument();
    expect(screen.getByText("male")).toBeInTheDocument();

    // Matched bands.
    expect(screen.getByText("سجل تجاري/ترخيص ساري ومستندات كاملة")).toBeInTheDocument();
    expect(screen.getByText("ملكية رجل")).toBeInTheDocument();

    // Points per criterion + the total row.
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    expect(screen.getByText("0 / 15")).toBeInTheDocument();
    expect(screen.getByText("الإجمالي")).toBeInTheDocument();
    expect(screen.getByText("8 / 100")).toBeInTheDocument();

    // Rubric version + computed-at metadata.
    expect(screen.getByText("participation-v1")).toBeInTheDocument();
  });

  it("shows the need-inverted hint for equipment scorecards only", () => {
    useScorecardMock.mockReturnValue({
      data: { ...scorecard, kind: "equipment", rubricVersion: "equipment-v1" },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    renderDialog({ kind: "equipment" });

    expect(
      screen.getByText("تقييم الاحتياج: عدم توفر المعدة يمنح نقاطًا أعلى")
    ).toBeInTheDocument();
  });

  it("hides the need-inverted hint for participation scorecards", () => {
    useScorecardMock.mockReturnValue({
      data: scorecard,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    renderDialog({ kind: "participation" });

    expect(
      screen.queryByText("تقييم الاحتياج: عدم توفر المعدة يمنح نقاطًا أعلى")
    ).not.toBeInTheDocument();
  });

  it("renders an explanatory empty state on 409 — never an error surface", () => {
    useScorecardMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { status: 409, message: "Workshop has no survey in Complete state" },
      refetch: vi.fn(),
    });
    renderDialog({ kind: "participation" });

    expect(
      screen.getByText(
        "بطاقة المشاركة غير متاحة لهذه الورشة: يلزم استبيان مكتمل (اجتياز التحقق التلقائي) أولًا."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("الإجمالي")).not.toBeInTheDocument();
  });

  it("explains the equipment gateway on an equipment 409", () => {
    useScorecardMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { status: 409, message: "not in the recommended set" },
      refetch: vi.fn(),
    });
    renderDialog({ kind: "equipment" });

    expect(
      screen.getByText(
        "بطاقة المعدات متاحة فقط للورش ضمن القائمة الموصى بها من أحدث تشغيلة مشاركة."
      )
    ).toBeInTheDocument();
  });

  it("keeps a retryable error state for unexpected failures", () => {
    const refetch = vi.fn();
    useScorecardMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { status: 500, message: "boom" },
      refetch,
    });
    renderDialog();

    expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
  });
});
