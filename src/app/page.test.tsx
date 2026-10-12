import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const replaceMock = vi.fn();
const readSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

vi.mock("@/features/auth", () => ({
  readSession: () => readSessionMock(),
}));

import RootPage from "./page";

const fakeSession = {
  token: "access",
  expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
  refreshToken: "refresh",
  user: {
    id: "1",
    username: "admin",
    email: "a@b.c",
    fullName: "Admin",
    role: "SuperAdmin",
    isActive: true,
    permissions: ["*"],
  },
};

describe("root boot routing", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    readSessionMock.mockReset();
  });

  it("routes a stored session straight to the dashboard", () => {
    readSessionMock.mockReturnValue(fakeSession);

    render(<RootPage />);

    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });

  it("routes an empty browser to the login page", () => {
    readSessionMock.mockReturnValue(null);

    render(<RootPage />);

    expect(replaceMock).toHaveBeenCalledWith("/auth/login");
  });

  it("decides once even if the effect re-runs", () => {
    readSessionMock.mockReturnValue(fakeSession);

    const { rerender } = render(<RootPage />);
    rerender(<RootPage />);

    expect(replaceMock).toHaveBeenCalledTimes(1);
  });
});
