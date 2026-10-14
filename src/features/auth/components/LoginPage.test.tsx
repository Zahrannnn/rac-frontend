import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const loginWithSession = vi.fn();
const resumeSession = vi.fn();
const replaceMock = vi.fn();
const { hoistedStoredSession } = vi.hoisted(() => ({
  hoistedStoredSession: { current: null as unknown },
}));

const usernameInput = () => screen.getByRole("textbox", { name: /المستخدم|username/i });
const passwordInput = () => screen.getByLabelText(/كلمة المرور|password/i, { selector: "input" });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

vi.mock("../api/session-adapter", () => ({
  loginWithSession: (...args: unknown[]) => loginWithSession(...args),
  logoutSession: () => undefined,
  readSession: () => hoistedStoredSession.current,
  clearSession: () => {
    hoistedStoredSession.current = null;
  },
  refreshSession: () => Promise.resolve(null),
  resumeSession: (...args: unknown[]) => resumeSession(...args),
  getSessionSnapshot: () => hoistedStoredSession.current,
  subscribeToSession: () => () => {},
}));

import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../hooks/use-auth-session";
import { I18nProvider } from "@/shared/i18n";
import type { Session } from "../types";

const fakeSession: Session = {
  token: "stale-access",
  expiresAtUtc: new Date(Date.now() - 60_000).toISOString(),
  refreshToken: "refresh-token",
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
      refreshToken: "refresh-token",
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

describe("LoginPage stored-session boot path", () => {
  beforeEach(() => {
    loginWithSession.mockReset();
    resumeSession.mockReset();
    replaceMock.mockReset();
    hoistedStoredSession.current = null;
    window.localStorage.clear();
  });

  it("sends a stored session to the dashboard when the resume lands", async () => {
    hoistedStoredSession.current = fakeSession;
    resumeSession.mockResolvedValue({ ...fakeSession, token: "fresh-access" });

    renderLogin();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
    // The skeleton, not the form, is what shows while the probe runs.
    expect(screen.queryByRole("button", { name: /دخول|sign in/i })).toBeNull();
  });

  it("still redirects when the effect re-runs while the probe is in flight", async () => {
    hoistedStoredSession.current = fakeSession;
    resumeSession.mockResolvedValue({ ...fakeSession, token: "fresh-access" });

    render(
      <StrictMode>
        <I18nProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </I18nProvider>
      </StrictMode>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(resumeSession).toHaveBeenCalledOnce();
  });

  it("falls back to the form when the session is definitively rejected", async () => {
    hoistedStoredSession.current = fakeSession;
    resumeSession.mockImplementation(() => {
      hoistedStoredSession.current = null;
      return Promise.resolve(null);
    });

    renderLogin();

    expect(
      await screen.findByRole("button", { name: /دخول|sign in/i })
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("survives a rejecting probe without redirecting anywhere", async () => {
    hoistedStoredSession.current = fakeSession;
    resumeSession.mockRejectedValue(new Error("unexpected"));

    renderLogin();

    await waitFor(() => expect(resumeSession).toHaveBeenCalledOnce());
    // Give the settled rejection a tick — no navigation, no unhandled crash.
    await act(async () => {});
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("escapes a wedged probe through the watchdog", async () => {
    vi.useFakeTimers();
    try {
      hoistedStoredSession.current = fakeSession;
      resumeSession.mockReturnValue(new Promise(() => {}));

      renderLogin();

      await act(async () => {
        vi.advanceTimersByTime(29_999);
      });
      expect(replaceMock).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    } finally {
      vi.useRealTimers();
    }
  });
});
