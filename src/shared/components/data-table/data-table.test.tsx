import type { ReactElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/shared/i18n";
import { DataTable, type DataTableColumn } from "./data-table";

function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

type Row = { id: string; code: string; name: string; count: number };

const columns: DataTableColumn<Row>[] = [
  {
    key: "code",
    header: "Code",
    cell: (row) => row.code,
    sortValue: (row) => row.code,
    className: "w-24",
  },
  { key: "name", header: "Name", cell: (row) => row.name },
  {
    key: "count",
    header: "Count",
    cell: (row) => row.count,
    sortValue: (row) => row.count,
    align: "end",
  },
];

const rows: Row[] = [
  { id: "1", code: "MAC-002", name: "Beta", count: 5 },
  { id: "2", code: "MAC-001", name: "Alpha", count: 9 },
  { id: "3", code: "MAC-003", name: "Gamma", count: 1 },
];

function bodyRows() {
  return screen.getAllByRole("row").slice(1);
}

describe("DataTable", () => {
  it("renders headers and one row per data item", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Workshops"
      />
    );

    expect(screen.getByRole("table", { name: "Workshops" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3
    expect(screen.getByText("MAC-001")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("sorts client-side when a column carries sortValue", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Sorted"
      />
    );

    const countHeader = screen.getByRole("button", { name: /Count/ });
    fireEvent.click(countHeader);
    let counts = bodyRows().map(
      (row) => Number(within(row).getAllByRole("cell")[2].textContent)
    );
    // Numeric columns sort desc-first (TanStack auto): biggest values first.
    expect(counts).toEqual([9, 5, 1]);
    expect(screen.getByRole("columnheader", { name: /Count/ })).toHaveAttribute(
      "aria-sort",
      "descending"
    );

    fireEvent.click(countHeader);
    counts = bodyRows().map(
      (row) => Number(within(row).getAllByRole("cell")[2].textContent)
    );
    expect(counts).toEqual([1, 5, 9]);
    expect(screen.getByRole("columnheader", { name: /Count/ })).toHaveAttribute(
      "aria-sort",
      "ascending"
    );
  });

  it("keeps unsortable columns free of sort controls and aria-sort", () => {
    renderWithI18n(
      <DataTable
        columns={columns.filter((column) => column.key !== "count")}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Mixed"
      />
    );

    expect(screen.queryByRole("button", { name: /Name/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute(
      "aria-sort"
    );
  });

  it("fires onRowClick from click and keyboard activation", () => {
    const onRowClick = vi.fn();
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Clickable"
        onRowClick={(row) => onRowClick(row.id)}
      />
    );

    const row = bodyRows()[0];
    expect(row).toHaveAttribute("tabindex", "0");
    fireEvent.click(row);
    expect(onRowClick).toHaveBeenCalledWith("1");
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it("shows skeleton rows while loading and none of the data", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Loading"
        isLoading
        loadingRows={3}
      />
    );

    expect(screen.queryByText("MAC-001")).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Loading" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("shows the error state with retry", () => {
    const onRetry = vi.fn();
    renderWithI18n(
      <DataTable
        columns={columns}
        data={undefined}
        getRowId={(row) => row.id}
        ariaLabel="Errored"
        error
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows the empty state with caller title and action", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        ariaLabel="Empty"
        emptyState={{
          title: "No workshops",
          hint: "Register one",
          action: <button>Add</button>,
        }}
      />
    );

    expect(screen.getByText("No workshops")).toBeInTheDocument();
    expect(screen.getByText("Register one")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("renders the pagination footer with the caller's summary", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Paged"
        pagination={{
          page: 2,
          totalPages: 5,
          onPageChange: () => undefined,
          summary: "24 workshops · page 2 of 5",
        }}
      />
    );

    expect(screen.getByText("24 workshops · page 2 of 5")).toBeInTheDocument();
  });

  it("applies rowClassName per row", () => {
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Tinted"
        rowClassName={(row) => (row.id === "2" ? "bg-amber-100" : undefined)}
      />
    );

    const tinted = bodyRows().find((row) => within(row).queryByText("MAC-001") !== null);
    expect(tinted?.className).toContain("bg-amber-100");
    expect(bodyRows()[0].className).not.toContain("bg-amber-100");
  });

  it("renders mobile cards alongside the table when a card renderer is given", () => {
    // jsdom has no responsive hiding — both trees mount; the md:hidden /
    // hidden md:block classes handle the actual responsive swap.
    renderWithI18n(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        ariaLabel="Responsive"
        mobileCard={(row) => <div>{`card-${row.code}`}</div>}
      />
    );

    expect(screen.getByText("card-MAC-001")).toBeInTheDocument();
    expect(screen.getByText("MAC-001")).toBeInTheDocument();
  });
});
