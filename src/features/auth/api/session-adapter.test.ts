import { afterEach, describe, expect, it, vi } from "vitest";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { Mock } from "vitest";
import { racApi } from "@/shared/api/rac-api";
import {
  clearSession,
  handleUnauthorizedError,
  loginWithSession,
  logoutSession,
  readSession,
  refreshSession,
  rotateSession,
  subscribeToSession,
} from "./session-adapter";
import { sessionStorageKey } from "../constants/session";
import type { Session } from "../types";

vi.mock("@/shared/api/rac-api", () => ({
  racApi: { get: vi.fn(), post: vi.fn(), request: vi.fn() },
  registerUnauthorizedHandler: vi.fn(),
}));

const getMock = racApi.get as unknown as Mock;
const postMock = racApi.post as unknown as Mock;
const requestMock = racApi.request as unknown as Mock;

const MINUTE = 60_000;

const user = {
  id: "1",
  username: "admin",
  email: "a@b.c",
  fullName: "Admin",
  role: "SuperAdmin" as const,
  isActive: true,
  permissions: ["*"],
};

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    token: "access-token",
    expiresAtUtc: new Date(Date.now() + MINUTE).toISOString(),
    refreshToken: "refresh-token",
    user,
    ...overrides,
  };
}

function seedLocalSession(overrides: Partial<Session> = {}): Session {
  const session = makeSession(overrides);
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  return session;
}

function storedSession(): Session | null {
  const raw = window.localStorage.getItem(sessionStorageKey);
  return raw ? (JSON.parse(raw) as Session) : null;
}

function seedRotatedSession() {
  postMock.mockResolvedValue({
    data: {
      accessToken: "rotated-access",
      expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
      refreshToken: "rotated-refresh",
      user,
    },
  });
}

function unauthorizedError(url: string): AxiosError {
  return {
    config: { url, headers: {} },
    response: { status: 401 },
  } as unknown as AxiosError;
}

function stubWebLocks(onAcquire?: () => void) {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_name: string, callback: () => Promise<unknown>) => {
        onAcquire?.();
        return callback();
      },
    },
  });
}

afterEach(() => {
  window.localStorage.clear();
  getMock.mockReset();
  postMock.mockReset();
  requestMock.mockReset();
  delete (navigator as unknown as { locks?: unknown }).locks;
  vi.useRealTimers();
});

describe("readSession", () => {
  it("returns the cached session while the access token is live", () => {
    seedLocalSession();

    expect(readSession()?.user.username).toBe("admin");
  });

  it("keeps the cached session once the access token expires — the refresh token owns validity now", () => {
    seedLocalSession({ expiresAtUtc: new Date(Date.now() - 60 * MINUTE).toISOString() });

    const session = readSession();

    expect(session?.refreshToken).toBe("refresh-token");
    expect(window.localStorage.getItem(sessionStorageKey)).not.toBeNull();
  });

  it("sweeps a legacy session that carries no refresh token", () => {
    const legacy = makeSession() as Partial<Session>;
    delete legacy.refreshToken;
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(legacy));

    expect(readSession()).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("discards a cached session that is missing the profile", () => {
    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({
        token: "access-token",
        expiresAtUtc: new Date(Date.now() + MINUTE).toISOString(),
        refreshToken: "refresh-token",
      })
    );

    expect(readSession()).toBeNull();
  });

  it("clearSession removes the cache", () => {
    seedLocalSession();

    clearSession();

    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});

describe("loginWithSession", () => {
  const loginInput = { usernameOrEmail: "admin", password: "Admin#12345" };

  it("persists the full 4-field session from the login response alone (no /auth/me probe)", async () => {
    postMock.mockResolvedValue({
      data: {
        accessToken: "access-1",
        expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
        refreshToken: "refresh-1",
        user,
      },
    });

    const session = await loginWithSession(loginInput);

    expect(session.token).toBe("access-1");
    expect(session.refreshToken).toBe("refresh-1");
    expect(session.user.username).toBe("admin");
    expect(getMock).not.toHaveBeenCalled();

    const stored = storedSession();
    expect(stored?.token).toBe("access-1");
    expect(stored?.refreshToken).toBe("refresh-1");
    expect(stored?.user.username).toBe("admin");
  });

  it("passes a 401 from the login POST through untouched (wrong credentials)", async () => {
    postMock.mockRejectedValue({ status: 401 });

    await expect(loginWithSession(loginInput)).rejects.toMatchObject({ status: 401 });
  });

  it("keeps the token pair out of the failure path", async () => {
    postMock.mockRejectedValue({ status: 401 });

    await expect(loginWithSession(loginInput)).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});

describe("rotateSession", () => {
  it("rotates the pair and persists the new session", async () => {
    seedLocalSession();
    seedRotatedSession();

    const session = await rotateSession();

    expect(postMock).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-token" });
    expect(session?.token).toBe("rotated-access");
    expect(session?.refreshToken).toBe("rotated-refresh");

    const stored = storedSession();
    expect(stored?.token).toBe("rotated-access");
    expect(stored?.refreshToken).toBe("rotated-refresh");
  });

  it("single-flights concurrent rotations into exactly one /auth/refresh", async () => {
    seedLocalSession();
    let resolveRefresh: (value: unknown) => void = () => undefined;
    postMock.mockImplementation(
      () => new Promise((resolve) => (resolveRefresh = resolve))
    );

    const first = rotateSession();
    const second = rotateSession();

    expect(postMock).toHaveBeenCalledTimes(1);

    resolveRefresh({
      data: {
        accessToken: "rotated-access",
        expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
        refreshToken: "rotated-refresh",
        user,
      },
    });

    const [a, b] = await Promise.all([first, second]);
    expect(a?.token).toBe("rotated-access");
    expect(b?.token).toBe("rotated-access");
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("clears the session when the refresh is rejected with 401", async () => {
    seedLocalSession();
    postMock.mockRejectedValue({ status: 401 });

    await expect(rotateSession()).resolves.toBeNull();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("keeps the session when the refresh fails on transport (cold backend)", async () => {
    const session = seedLocalSession();
    postMock.mockRejectedValue({ message: "timeout of 20000ms exceeded" });

    const result = await rotateSession();

    expect(result?.token).toBe(session.token);
    expect(storedSession()?.refreshToken).toBe("refresh-token");
  });

  it("adopts another tab's rotation while waiting for the lock — no network call", async () => {
    stubWebLocks(() => {
      // Another tab rotated while this one waited for the lock.
      seedLocalSession({ token: "tab-a-access", refreshToken: "tab-a-refresh" });
    });
    seedLocalSession();

    const session = await rotateSession();

    expect(postMock).not.toHaveBeenCalled();
    expect(session?.token).toBe("tab-a-access");
    expect(session?.refreshToken).toBe("tab-a-refresh");
  });

  it("releases the localStorage fallback lock after the rotation", async () => {
    let resolveRefresh: (value: unknown) => void = () => undefined;
    postMock.mockImplementation(
      () => new Promise((resolve) => (resolveRefresh = resolve))
    );
    seedLocalSession();

    const pending = rotateSession();

    expect(window.localStorage.getItem("rac.session.refresh.lock")).not.toBeNull();

    resolveRefresh({
      data: {
        accessToken: "rotated-access",
        expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
        refreshToken: "rotated-refresh",
        user,
      },
    });
    await pending;

    expect(window.localStorage.getItem("rac.session.refresh.lock")).toBeNull();
  });
});

describe("refreshSession", () => {
  it("returns the freshly rotated session", async () => {
    seedLocalSession();
    seedRotatedSession();

    const session = await refreshSession();

    expect(session?.token).toBe("rotated-access");
    expect(session?.refreshToken).toBe("rotated-refresh");
  });

  it("returns the cached session and keeps it when the refresh transport-fails", async () => {
    const session = seedLocalSession();
    postMock.mockRejectedValue({ status: 502 });

    const result = await refreshSession();

    expect(result?.token).toBe(session.token);
    expect(window.localStorage.getItem(sessionStorageKey)).not.toBeNull();
  });

  it("clears the session and returns null on a definitive 401", async () => {
    seedLocalSession();
    postMock.mockRejectedValue({ status: 401 });

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("returns null without a network call when nothing is cached", async () => {
    await expect(refreshSession()).resolves.toBeNull();
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe("handleUnauthorizedError (401 interceptor)", () => {
  it("never intercepts the auth endpoints themselves", async () => {
    for (const url of ["/auth/login", "/auth/refresh", "/auth/logout"]) {
      const error = unauthorizedError(url);

      await expect(handleUnauthorizedError(error)).rejects.toBe(error);
    }
    expect(postMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("retries the original request exactly once with the new access token", async () => {
    seedLocalSession();
    seedRotatedSession();
    requestMock.mockResolvedValue({ data: "ok" });

    const error = unauthorizedError("/workshops");
    const result = await handleUnauthorizedError(error);

    expect(result).toEqual({ data: "ok" });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-token" });
    expect(requestMock).toHaveBeenCalledTimes(1);
    const config = requestMock.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(config.url).toBe("/workshops");
    expect(config.headers.Authorization).toBe("Bearer rotated-access");
  });

  it("single-flights two parallel 401s into one refresh and retries both requests", async () => {
    seedLocalSession();
    let resolveRefresh: (value: unknown) => void = () => undefined;
    postMock.mockImplementation(
      () => new Promise((resolve) => (resolveRefresh = resolve))
    );
    requestMock.mockResolvedValue({ data: "ok" });

    const first = handleUnauthorizedError(unauthorizedError("/workshops"));
    const second = handleUnauthorizedError(unauthorizedError("/dashboard"));

    await Promise.resolve();
    expect(postMock).toHaveBeenCalledTimes(1);

    resolveRefresh({
      data: {
        accessToken: "rotated-access",
        expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
        refreshToken: "rotated-refresh",
        user,
      },
    });

    await Promise.all([first, second]);

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledTimes(2);
    for (const call of requestMock.mock.calls) {
      expect((call[0] as InternalAxiosRequestConfig).headers.Authorization).toBe(
        "Bearer rotated-access"
      );
    }
  });

  it("clears the session and lets the original error propagate when the refresh is rejected", async () => {
    seedLocalSession();
    postMock.mockRejectedValue({ status: 401 });

    const error = unauthorizedError("/workshops");

    // jsdom logs a "not implemented" navigation error for the login redirect
    // that dropSessionAndRedirect fires; the contract under test here is the
    // session clear plus the original error surfacing.
    await expect(handleUnauthorizedError(error)).rejects.toBe(error);
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("propagates without the unauthenticated redirect when the refresh transport-fails (session kept)", async () => {
    seedLocalSession();
    postMock.mockRejectedValue({ message: "timeout of 20000ms exceeded" });

    const error = unauthorizedError("/workshops");

    await expect(handleUnauthorizedError(error)).rejects.toBe(error);
    expect(storedSession()?.refreshToken).toBe("refresh-token");
  });

  it("does not rotate twice for a request that was already retried", async () => {
    seedLocalSession();
    seedRotatedSession();
    requestMock.mockResolvedValue({ data: "ok" });

    const error = unauthorizedError("/workshops");
    await handleUnauthorizedError(error);

    await expect(handleUnauthorizedError(error)).rejects.toBe(error);

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});

describe("proactive refresh", () => {
  it("rotates about 2 minutes before the access token expires", async () => {
    vi.useFakeTimers();
    seedLocalSession({ expiresAtUtc: new Date(Date.now() + 5 * MINUTE).toISOString() });
    const unsubscribe = subscribeToSession(() => {});
    seedRotatedSession();

    await vi.advanceTimersByTimeAsync(5 * MINUTE - 2 * MINUTE - 1_000);
    expect(postMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-token" });

    unsubscribe();
  });

  it("reschedules after a successful rotation", async () => {
    vi.useFakeTimers();
    seedLocalSession({ expiresAtUtc: new Date(Date.now() + 5 * MINUTE).toISOString() });
    const unsubscribe = subscribeToSession(() => {});
    postMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          accessToken: `access-${postMock.mock.calls.length}`,
          expiresAtUtc: new Date(Date.now() + 60 * MINUTE).toISOString(),
          refreshToken: `refresh-${postMock.mock.calls.length}`,
          user,
        },
      })
    );

    await vi.advanceTimersByTimeAsync(3 * MINUTE);
    expect(postMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60 * MINUTE);
    expect(postMock).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("does not reschedule after a rotation that cleared the session", async () => {
    vi.useFakeTimers();
    seedLocalSession({ expiresAtUtc: new Date(Date.now() + 5 * MINUTE).toISOString() });
    const unsubscribe = subscribeToSession(() => {});
    postMock.mockRejectedValue({ status: 401 });

    await vi.advanceTimersByTimeAsync(3 * MINUTE);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();

    await vi.advanceTimersByTimeAsync(30 * MINUTE);
    expect(postMock).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("schedules nothing without a session", async () => {
    vi.useFakeTimers();
    const unsubscribe = subscribeToSession(() => {});

    await vi.advanceTimersByTimeAsync(60 * MINUTE);
    expect(postMock).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("stops scheduling after a logout", async () => {
    vi.useFakeTimers();
    seedLocalSession({ expiresAtUtc: new Date(Date.now() + 5 * MINUTE).toISOString() });
    const unsubscribe = subscribeToSession(() => {});

    clearSession();
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(postMock).not.toHaveBeenCalled();

    unsubscribe();
  });
});

describe("logoutSession", () => {
  it("posts /auth/logout with the refresh token, then clears the session", () => {
    seedLocalSession();
    postMock.mockResolvedValue(undefined);

    logoutSession();

    expect(postMock).toHaveBeenCalledWith(
      "/auth/logout",
      { refreshToken: "refresh-token" },
      { headers: { Authorization: "Bearer access-token" } }
    );
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("never lets a failed revocation fail the logout", () => {
    seedLocalSession();
    postMock.mockRejectedValue({ status: 500 });

    expect(() => logoutSession()).not.toThrow();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("skips the revocation call when there is no session", () => {
    logoutSession();

    expect(postMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});
