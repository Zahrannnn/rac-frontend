import { racApi } from "@/shared/api/rac-api";
import type { AuthUser, Session } from "../types";
import { withRefreshLock } from "./refresh-lock";
import { clearSession, getSessionEpoch, persistSession, readSession } from "./session-store";

// Circular import with session-store is deliberate and safe — see the note
// at the top of session-store.ts.

/**
 * The login and refresh endpoints return the same shape: a fresh access
 * token (60 minutes) plus a fresh refresh token (7 days, sliding — the
 * presented token is revoked server-side on every rotation).
 */
export type AuthTokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
  user: AuthUser;
};

// ---------------------------------------------------------------------------
// Token rotation core
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<Session | null> | null = null;

/**
 * Single-flight rotation: POST /auth/refresh with the stored refresh token.
 * Concurrent callers (parallel 401s, the proactive timer, LoginPage's check)
 * share one in-flight promise, so the backend sees exactly one rotation.
 *
 * - success: the new pair is persisted and subscribers notified only when
 *   the stored value actually changed;
 * - 401: the session is cleared (rotation is terminal then);
 * - transport error: the session is kept — a timeout or waking backend says
 *   nothing about the session's validity, data calls surface their own
 *   retryable errors and the next rotation retries.
 */
export function rotateSession(): Promise<Session | null> {
  if (!refreshInFlight) {
    refreshInFlight = runRotation().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function runRotation(): Promise<Session | null> {
  const triggering = readSession();
  if (!triggering?.refreshToken) {
    return null;
  }
  return withRefreshLock(() => rotateUnderLock(triggering.refreshToken));
}

async function rotateUnderLock(triggeringRefreshToken: string): Promise<Session | null> {
  // Inside the lock, re-read what is actually stored: another tab may have
  // rotated while this one waited, which makes the presented token a replay.
  const current = readSession();
  if (!current?.refreshToken) {
    return null;
  }
  if (current.refreshToken !== triggeringRefreshToken) {
    return current;
  }

  const epochAtStart = getSessionEpoch();

  try {
    const { data } = await racApi.post<AuthTokenResponse>("/auth/refresh", {
      refreshToken: triggeringRefreshToken,
    });

    // A logout may have raced the rotation (this tab or another one cleared
    // the session while the request was in flight) — never persist past it.
    if (epochAtStart !== getSessionEpoch()) {
      return null;
    }

    const session: Session = {
      token: data.accessToken,
      expiresAtUtc: data.expiresAtUtc,
      refreshToken: data.refreshToken,
      user: data.user,
    };
    // Notify subscribers only when something actually changed — re-persisting
    // an identical session would re-render every consumer for nothing.
    if (JSON.stringify(session) !== JSON.stringify(current)) {
      persistSession(session);
    }
    return session;
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      // The backend answers a replayed (already-rotated) token with a plain
      // 401 too — only clear when the rejected token is still the stored one.
      const stored = readSession();
      if (!stored || stored.refreshToken === triggeringRefreshToken) {
        clearSession();
        return null;
      }
      return stored;
    }
    // Transport failure — keep the session (see rotateSession).
    return current;
  }
}

// ---------------------------------------------------------------------------
// Proactive refresh
// ---------------------------------------------------------------------------

const proactiveRefreshLeadMs = 2 * 60 * 1000;
const maxTimerDelayMs = 2 ** 31 - 1;

let proactiveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedules a rotation ~2 minutes before the access token expires while the
 * app is open. Owned by the session store: armed on login/rotation
 * (persistSession) and when the store is adopted (subscribe), cancelled on
 * logout and when the last subscriber goes away. Background tabs may delay
 * the timer — a late rotation still succeeds on the refresh token, and if
 * the access token already expired the 401 interceptor covers the gap.
 *
 * Loop-proof: after each rotation it re-derives the delay from the stored
 * session — a cleared session or an already-inside-the-window expiry
 * schedules nothing.
 */
export function scheduleProactiveRefresh() {
  if (typeof window === "undefined") {
    return;
  }
  cancelProactiveRefresh();

  const session = readSession();
  if (!session?.refreshToken) {
    return;
  }

  const delay = new Date(session.expiresAtUtc).getTime() - Date.now() - proactiveRefreshLeadMs;
  if (delay <= 0) {
    return;
  }

  proactiveTimer = setTimeout(() => {
    proactiveTimer = null;
    void rotateSession()
      .then(() => scheduleProactiveRefresh())
      .catch(() => undefined);
  }, Math.min(delay, maxTimerDelayMs));
}

export function cancelProactiveRefresh() {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
}
