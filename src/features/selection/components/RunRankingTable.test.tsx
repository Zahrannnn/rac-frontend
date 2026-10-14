import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { SelectionRunRankedRow } from "../types";
import { RunRankingTable } from "./RunRankingTable";

const rankedRow = (over: Partial<SelectionRunRankedRow>): SelectionRunRankedRow => ({
  rank: 1,
  rankInGovernorate: 1,
  workshopId: "w-1",
  workshopCode: "MAC-CAR-000042",
  workshopName: "ورشة النور",
  governorate: "Cairo",
  totalScore: 88,
  tier: "recommended",
  criteria: [],
  ...over,
});

function renderTable(rows: SelectionRunRankedRow[]) {
  return render(
    <I18nProvider>
      <RunRankingTable rows={rows} onOpenScorecard={vi.fn()} />
    </I18nProvider>
  );
}

describe("RunRankingTable", () => {
  it("renders the ranked list with the server rank order intact", () => {
    renderTable([
      rankedRow({}),
      rankedRow({
        rank: 2,
        workshopId: "w-2",
        workshopCode: "MAC-CAR-000043",
        workshopName: "ورشة الأمل",
        totalScore: 81,
      }),
    ]);

    expect(screen.getByRole("table", { name: "القائمة المرتبة" })).toBeInTheDocument();

    // Rank/score ARE the content — no sort controls on those columns; the
    // workshop name is the only convenience sort.
    expect(screen.queryByRole("button", { name: "الترتيب" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "الدرجة" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الورشة" })).toBeInTheDocument();

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows[0]).toHaveTextContent("#1");
    expect(bodyRows[1]).toHaveTextContent("#2");
    expect(screen.getAllByText("موصى بها")).toHaveLength(2);
  });
});
