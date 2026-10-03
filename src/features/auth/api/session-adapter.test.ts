import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { racApi } from "@/shared/api/rac-api";
import {
  clearSession,
  loginWithSession,
  readSession,
  refreshSession,
} from "./session-adapter";
import { sessionStorageKey } from "../constants/session";
import type { Session } from "../types";

vi.mock("@/shared/api/rac-api", () => ({
  racApi: { get: vi.fn(), post: vi.fn() },
}));

const getMock = racApi.get as unknown as Mock;
const postMock = racApi.post as unknown as Mock;

const HOUR_FROM_NOW = new Date(Date.now() + 3600_000);

const session: Session = {
  token: "test-token",
  expiresAtUtc: HOUR_FROM_NOW.toISOString(),
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

function seedLocalSession() {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

afterEach(() => {
  window.localStorage.clear();
  getMock.mockReset();
  postMock.mockReset();
  vi.useRealTimers();
});

describe("readSession", () => {
  it("returns the cached session while it has not expired", () => {
    seedLocalSession();

    expect(readSession()?.user.username).toBe("admin");
  });

  it("discards the cached session once it is expired", () => {
    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ ...session, expiresAtUtc: new Date(Date.now() - 60_000).toISOString() })
    );

    expect(readSession()).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it("discards a cached session that is missing the profile", () => {
    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ expiresAtUtc: HOUR_FROM_NOW.toISOString() })
    );

    expect(readSession()).toBeNull();
  });

  it("clearSession removes the cache", () => {
    seedLocalSession();

    clearSession();

    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});

describe("refreshSession", () => {
  it("keeps the cached session when /me fails without a status (timeout / cold backend)", async () => {
    seedLocalSession();
    getMock.mockRejectedValue({ message: "timeout of 20000ms exceeded" });
    vi.useFakeTimers();

    const promise = refreshSession();
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await promise;

    expect(result?.user.username).toBe("admin");
    expect(window.localStorage.getItem(sessionStorageKey)).not.toBeNull();
  });

  it("keeps the cached session when /me fails with a 5xx", async () => {
    seedLocalSession();
    getMock.mockRejectedValue({ status: 502 });
    vi.useFakeTimers();

    const promise = refreshSession();
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await promise;

    expect(result?.user.username).toBe("admin");
    expect(window.localStorage.getItem(sessionStorageKey)).not.toBeNull();
  });

  it("clears the cached session only on a definitive 401", async () => {
    seedLocalSession();
    getMock.mockRejectedValue({ status: 401 });

    const result = await refreshSession();

    expect(result).toBeNull();
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});

describe("loginWithSession", () => {
  const loginInput = { usernameOrEmail: "admin", password: "Admin#12345" };

  function mockSuccessfulLoginPost() {
    postMock.mockResolvedValue({
      data: {
        accessToken: "token",
        expiresAtUtc: HOUR_FROM_NOW.toISOString(),
        user: { id: "1", username: "admin" },
      },
    });
  }

  it("passes a 401 from the login POST through untouched (wrong credentials)", async () => {
    postMock.mockRejectedValue({ status: 401 });

    await expect(loginWithSession(loginInput)).rejects.toMatchObject({ status: 401 });
  });

  it("reports a 401 from the post-login /me probe as a server problem (503), not wrong credentials", async () => {
    mockSuccessfulLoginPost();
    getMock.mockRejectedValue({ status: 401 });

    await expect(loginWithSession(loginInput)).rejects.toMatchObject({ status: 503 });
  });

  it("persists the session with the access token when both calls succeed", async () => {
    mockSuccessfulLoginPost();
    getMock.mockResolvedValue({
      data: {
        id: "1",
        username: "admin",
        email: "a@b.c",
        fullName: "Admin",
        role: "SuperAdmin",
        isActive: true,
        permissions: ["*"],
      },
    });

    const session = await loginWithSession(loginInput);

    expect(session.user.username).toBe("admin");
    expect(session.token).toBe("token");
    const stored = JSON.parse(window.localStorage.getItem(sessionStorageKey) ?? "{}");
    expect(stored.token).toBe("token");
    expect(stored.user.username).toBe("admin");
  });

  it("keeps the access token out of the failure path", async () => {
    postMock.mockRejectedValue({ status: 401 });
    await expect(loginWithSession(loginInput)).rejects.toMatchObject({ status: 401 });
    expect(window.localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});
