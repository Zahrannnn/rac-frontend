import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { AdminUser } from "../types";

const {
  useUsers,
  useUser,
  useCreateUser,
  usePatchUserStatus,
  useChangeUserRole,
  useResetUserPassword,
  useUpdateUser,
} = vi.hoisted(() => ({
  useUsers: vi.fn(),
  useUser: vi.fn(),
  useCreateUser: vi.fn(),
  usePatchUserStatus: vi.fn(),
  useChangeUserRole: vi.fn(),
  useResetUserPassword: vi.fn(),
  useUpdateUser: vi.fn(),
}));

vi.mock("../hooks/use-admin", () => ({
  useUsers,
  useUser,
  useCreateUser,
  usePatchUserStatus,
  useChangeUserRole,
  useResetUserPassword,
  useUpdateUser,
}));

import { UsersTab } from "./UsersTab";

const user = (over: Partial<AdminUser>): AdminUser => ({
  id: "u-1",
  username: "admin",
  email: "admin@example.org",
  fullName: "أحمد محمود",
  role: "SuperAdmin",
  isActive: true,
  ...over,
});

function renderTab(users: AdminUser[]) {
  useUsers.mockReturnValue({
    data: { items: users, page: 1, pageSize: 20, totalCount: users.length },
    isPending: false,
    isPlaceholderData: false,
    isError: false,
    refetch: vi.fn(),
  });
  useUser.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() });
  // The closed create/detail dialogs still run their mutation hooks on mount.
  useCreateUser.mockReturnValue({ mutate: vi.fn(), isPending: false });
  usePatchUserStatus.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useChangeUserRole.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useResetUserPassword.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useUpdateUser.mockReturnValue({ mutate: vi.fn(), isPending: false });

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <UsersTab />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("UsersTab", () => {
  it("renders the users table with role and status badges", () => {
    renderTab([
      user({}),
      user({
        id: "u-2",
        username: "viewer",
        fullName: "مروى حسن",
        role: "TrainerViewer",
        isActive: false,
      }),
    ]);

    expect(screen.getByRole("table", { name: "المستخدمون" })).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("أحمد محمود")).toBeInTheDocument();
    // Status is never color alone — the badge carries the text label.
    expect(screen.getByText("نشط")).toBeInTheDocument();
    expect(screen.getByText("موقوف")).toBeInTheDocument();
  });

  it("opens the detail dialog when a row is activated", async () => {
    renderTab([user({})]);

    fireEvent.click(screen.getByRole("row", { name: /admin/ }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
