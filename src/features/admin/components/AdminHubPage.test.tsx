import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { RolePermissionsRow } from "../types";

const authState: { permissions: string[] } = { permissions: [] };

vi.mock("@/features/auth", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { permissions: authState.permissions } }),
}));

const queryState: {
  users: { totalCount: number } | undefined;
  matrix: RolePermissionsRow[] | undefined;
  audit: { totalCount: number } | undefined;
} = {
  users: { totalCount: 6 },
  matrix: [
    { role: "SuperAdmin", permissions: ["*"] },
    { role: "ProjectManager", permissions: ["workshops:view", "admin:audit"] },
    { role: "FieldTeams", permissions: ["workshops:view", "workshops:create"] },
  ],
  audit: { totalCount: 160 },
};

vi.mock("../hooks/use-admin", () => ({
  useUsers: () => ({ data: queryState.users }),
  usePermissionMatrix: () => ({ data: queryState.matrix }),
  useAuditLogs: () => ({ data: queryState.audit }),
}));

import { AdminHubPage } from "./AdminHubPage";

function renderHub() {
  return render(
    <I18nProvider>
      <AdminHubPage />
    </I18nProvider>
  );
}

beforeEach(() => {
  authState.permissions = ["*"];
});

describe("AdminHubPage", () => {
  it("renders the hero figures and every surface card for the SuperAdmin", () => {
    renderHub();

    // Hero figures: users 6, roles 3 (mocked matrix rows), audit 160.
    expect(screen.getByText("مستخدمون")).toBeInTheDocument();
    expect(screen.getByText("أدوار")).toBeInTheDocument();
    expect(screen.getByText("حركة تدقيق")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();

    // All four surface cards are linked.
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/admin/users", "/admin/permissions", "/admin/audit"]);
  });

  it("renders only the audit card and audit figure for an audit-only permission", () => {
    authState.permissions = ["admin:audit"];
    renderHub();

    expect(screen.getByText("حركة تدقيق")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();
    expect(screen.queryByText("مستخدمون")).not.toBeInTheDocument();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/admin/audit"]);
  });

  it("renders the forbidden state without any admin permission", () => {
    authState.permissions = ["workshops:view"];
    renderHub();

    expect(
      screen.getByText("لا تملك الصلاحية اللازمة لعرض هذه الصفحة.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("حركة تدقيق")).not.toBeInTheDocument();
  });
});
