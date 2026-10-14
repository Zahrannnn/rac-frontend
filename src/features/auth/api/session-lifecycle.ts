import { racApi } from "@/shared/api/rac-api";
import type { LoginInput, Session } from "../types";
import { clearSession, persistSession, readSession } from "./session-store";
import { rotateSession, type AuthTokenResponse } from "./token-rotation";

/**
 * POST /auth/login. The returned token pair is persisted in the local
 * session and the access token is sent as the Authorization header on every
 * API call — the deployed backend and frontend live on different sites,
 * where browsers block or drop cross-site cookies.
 */
export async function loginWithSession(input: LoginInput): Promise<Session> {
  const { data } = await withColdStartRetry(
    () =>
      racApi.post<AuthTokenResponse>("/auth/login", {
        usernameOrEmail: input.usernameOrEmail,
        password: input.password,
      }),
    2
  );

  const session: Session = {
    token: data.accessToken,
    expiresAtUtc: data.expiresAtUtc,
    refreshToken: data.refreshToken,
    user: data.user,
  };
  persistSession(session);
  return session;
}

/**
 * Re-checks the cached session against the server by rotating the token
 * pair (POST /auth/refresh): a live session comes back with fresh tokens
 * and a fresh profile; a rejected one is cleared.
 */
export async function refreshSession(): Promise<Session | null> {
  return rotateSession();
}

/**
 * Boot-time resume for the login/root routing: rotation with cold-start
 * retries, because the hosted backend can need tens of seconds to wake and
 * a transport failure says nothing about the session's validity.
 *
 * - a rotation lands (fresh or adopted-from-another-tab token) → the session;
 * - the backend definitively rejects the token → null (session cleared);
 * - every attempt dies on transport → the stored session, unchanged — the
 *   caller proceeds into the app and the 401 interceptor finishes recovery.
 */
export async function resumeSession(attempts = 3): Promise<Session | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const tokenBefore = readSession()?.token ?? null;
    const result = await rotateSession();

    if (!result) {
      return null;
    }
    if (result.token !== tokenBefore) {
      return result;
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 2000));
    }
  }

  return readSession();
}

/**
 * Clears the local session, revoking the refresh token server-side first.
 * The revocation is fire-and-forget: it must never block or fail the UI
 * logout, and a missed revoke merely leaves the 7-day token to slide into
 * inactivity. The Bearer header is pinned explicitly because the request
 * interceptor reads the persisted token in a microtask — by then the local
 * clear below has already run.
 */
export function logoutSession() {
  const session = readSession();
  if (session?.refreshToken) {
    void racApi
      .post(
        "/auth/logout",
        { refreshToken: session.refreshToken },
        { headers: { Authorization: `Bearer ${session.token}` } }
      )
      .catch(() => undefined);
  }
  clearSession();
}

function isTransportError(error: unknown): boolean {
  const { status } = error as { status?: number };
  return status === undefined || status >= 500;
}

/**
 * The hosted backend sleeps when idle and can take tens of seconds to wake;
 * single attempts routinely exceed the client timeout right after idle.
 * Retries only transport-level failures (no status, or 5xx) with backoff —
 * a 401 or 400 is an answer, not an outage.
 */
async function withColdStartRetry<T>(attempt: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!isTransportError(error) || i === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, (i + 1) * 2000));
    }
  }

  throw lastError;
}
