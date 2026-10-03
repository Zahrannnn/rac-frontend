import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const loginWithSession = vi.fn();

const usernameInput = () => screen.getByRole("textbox", { name: /المستخدم|username/i });
const passwordInput = () => screen.getByLabelText(/كلمة المرور|password/i, { selector: "input" });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../api/session-adapter", () => ({
  loginWithSession: (...args: unknown[]) => loginWithSession(...args),
  readSession: () => null,
  clearSession: () => undefined,
  refreshSession: () => Promise.resolve(null),
  getSessionSnapshot: () => null,
  subscribeToSession: () => () => {},
}));

import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../hooks/use-auth-session";
import { I18nProvider } from "@/shared/i18n";

function renderLogin() {
  return render(
    <I18nProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </I18nProvider>
  );
}

describe("LoginPage submit path", () => {
  beforeEach(() => {
    loginWithSession.mockReset();
    window.localStorage.clear();
  });

  it("logs in with the entered credentials against the mocked API", async () => {
    loginWithSession.mockResolvedValue({
      accessToken: "token",
      expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
      user: { id: "1", username: "admin", email: "a@b.c", fullName: "Admin", role: "SuperAdmin", isActive: true, permissions: ["*"] },
    });

    renderLogin();

    fireEvent.change(usernameInput(), {
      target: { value: "admin" },
    });
    fireEvent.change(passwordInput(), {
      target: { value: "Admin#12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /دخول|sign in/i }));

    await waitFor(() => expect(loginWithSession).toHaveBeenCalledOnce());
    expect(loginWithSession).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "Admin#12345",
    });
  });

  it("shows the Arabic invalid-credentials message on a 401", async () => {
    loginWithSession.mockRejectedValue({ status: 401, message: "Invalid credentials." });

    renderLogin();

    fireEvent.change(usernameInput(), {
      target: { value: "admin" },
    });
    fireEvent.change(passwordInput(), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /دخول|sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("بيانات الدخول غير صحيحة");
    expect(loginWithSession).toHaveBeenCalledOnce();
  });
});
