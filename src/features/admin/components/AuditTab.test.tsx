import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { AuditLogEntry } from "../types";

const { useAuditLogs } = vi.hoisted(() => ({ useAuditLogs: vi.fn() }));

vi.mock("../hooks/use-admin", () => ({ useAuditLogs }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AuditTab } from "./AuditTab";

const entry = (over: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: "a-1",
  entityName: "Workshop",
  entityId: "RAC-CAR-000125",
  action: "Modified",
  username: "admin",
  changes: {},
  atUtc: "2026-10-01T10:00:00Z",
  ...over,
});

function renderTab(items: AuditLogEntry[]) {
  useAuditLogs.mockReturnValue({
    data: { items, page: 1, pageSize: 50, totalCount: items.length },
    isPending: false,
    isPlaceholderData: false,
    isError: false,
    refetch: vi.fn(),
  });

  return render(
    <I18nProvider>
      <AuditTab />
    </I18nProvider>
  );
}

describe("AuditTab", () => {
  it("renders the audit log table in chronological server order — no sort controls", () => {
    renderTab([
      entry({}),
      entry({ id: "a-2", entityId: "RAC-CAR-000126", action: "Added", username: null }),
    ]);

    expect(screen.getByRole("table", { name: "سجل التدقيق" })).toBeInTheDocument();
    expect(screen.getByText("RAC-CAR-000125")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    // Status is never color alone — action badges carry their text labels.
    expect(screen.getByText("تعديل")).toBeInTheDocument();
    expect(screen.getByText("إضافة")).toBeInTheDocument();

    // Server order is the timeline — headers carry no sort controls.
    expect(screen.queryByRole("button", { name: "الوقت" })).not.toBeInTheDocument();
  });
});
