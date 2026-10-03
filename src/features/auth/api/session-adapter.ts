import { racApi, registerUnauthorizedHandler, type UnauthorizedHandler } from "@/shared/api/rac-api";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { routes } from "@/shared/constants/routes";
import { sessionStorageKey } from "../constants/session";
import type { AuthUser, LoginInput, Session } from "../types";

/**
 * The login and refresh endpoints return the same shape: a fresh access
 * token (60 minutes) plus a fresh refresh token (7 days, sliding — the
 * presented token is revoked server-side on every rotation).
 */
type AuthTokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
  user: AuthUser;
};

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
 * A session stays readable while a refresh token exists. The access token's
 * expiry is deliberately NOT part of this decision: it is short-lived by
 * design and the 401-interceptor refresh flow (or the proactive timer) owns
 * renewing it. Only structurally broken sessions — unparsable JSON, a
 * missing token pair or a missing profile — are swept from storage.
 */
export function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(sessionStorageKey);

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Session;

    if (session.token && session.refreshToken && session.user?.permissions) {
      return session;
    }
  } catch {
    // fall through to cleanup
  }

  window.localStorage.removeItem(sessionStorageKey);
  return null;
}

export function clearSession() {
  // Invalidate anything a rotation might still be trying to persist: after a
  // logout (local or in another tab) a late refresh response must not
  // resurrect the session.
  sessionEpoch += 1;
  cancelProactiveRefresh();
  window.localStorage.removeItem(sessionStorageKey);
  notifySessionChanged();
}

/**
 * Re-checks the cached session against the server by rotating the token
 * pair (POST /auth/refresh): a live session comes back with fresh tokens
 * and a fresh profile; a rejected one is cleared.
 */
export async function refreshSession(): Promise<Session | null> {
  return rotateSession();
}

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

  const epochAtStart = sessionEpoch;

  try {
    const { data } = await racApi.post<AuthTokenResponse>("/auth/refresh", {
      refreshToken: triggeringRefreshToken,
    });

    // A logout may have raced the rotation (this tab or another one cleared
    // the session while the request was in flight) — never persist past it.
    if (epochAtStart !== sessionEpoch) {
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
// Cross-tab refresh lock
// ---------------------------------------------------------------------------

const refreshLockName = "rac.session.refresh";
const refreshLockStorageKey = "rac.session.refresh.lock";
/** Stolen after this long — a tab that died mid-rotation must not deadlock the rest. */
const refreshLockStaleMs = 10_000;
const refreshLockWaitMs = 10_000;

type WebLockManagerLike = {
  request?: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
};

/**
 * Rotations are racy across tabs: tab B presenting tab A's just-rotated
 * token gets a 401 (the backend treats the replay as a plain 401). The lock
 * serializes tabs; the stored-token re-read inside makes the loser adopt the
 * winner's result instead of replaying.
 */
async function withRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & { locks?: WebLockManagerLike }).locks;

  if (typeof locks?.request === "function") {
    return locks.request(refreshLockName, operation);
  }
  return withLocalStorageLock(operation);
}

/**
 * localStorage mutex for browsers without Web Locks. Acquisition is not
 * atomic across tabs, but the rotation's stored-token re-read plus the
 * replay-401 guard cover the residual race.
 */
async function withLocalStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const lockId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + refreshLockWaitMs;

  while (!acquireLocalStorageLock(lockId)) {
    if (Date.now() >= deadline) {
      // Best-effort mutex: proceed rather than deadlock.
      return operation();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  try {
    return await operation();
  } finally {
    releaseLocalStorageLock(lockId);
  }
}

function acquireLocalStorageLock(lockId: string): boolean {
  const now = Date.now();
  let lock: { id?: string; expiresAt?: number } | null = null;
  try {
    const raw = window.localStorage.getItem(refreshLockStorageKey);
    lock = raw ? (JSON.parse(raw) as { id?: string; expiresAt?: number }) : null;
  } catch {
    lock = null; // malformed lock entry — steal it
  }
  if (lock?.id && lock.expiresAt && lock.expiresAt > now) {
    return false; // another tab holds a live lock
  }
  window.localStorage.setItem(
    refreshLockStorageKey,
    JSON.stringify({ id: lockId, expiresAt: now + refreshLockStaleMs })
  );
  return true;
}

function releaseLocalStorageLock(lockId: string) {
  try {
    const raw = window.localStorage.getItem(refreshLockStorageKey);
    const lock = raw ? (JSON.parse(raw) as { id?: string }) : null;
    // Release only a lock we still own — a stolen/expired entry may already
    // belong to another tab.
    if (lock?.id === lockId) {
      window.localStorage.removeItem(refreshLockStorageKey);
    }
  } catch {
    window.localStorage.removeItem(refreshLockStorageKey);
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
function scheduleProactiveRefresh() {
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

function cancelProactiveRefresh() {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 401 interceptor
// ---------------------------------------------------------------------------

const authEndpointPatterns = ["/auth/login", "/auth/refresh", "/auth/logout"];

function isAuthEndpoint(url?: string): boolean {
  return Boolean(url && authEndpointPatterns.some((pattern) => url.includes(pattern)));
}

type RetriedRequestConfig = InternalAxiosRequestConfig & { __racRetriedAuth?: boolean };

/**
 * Response-error handler for the RAC API instance (installed in rac-api.ts
 * via registerUnauthorizedHandler, which routes ONLY 401 responses here).
 *
 * - Never touches /auth/login, /auth/refresh or /auth/logout responses.
 * - Otherwise performs a single-flight rotation and retries the original
 *   request exactly once with the new access token (the marker on the
 *   request config stops a second rotation if the retry 401s again).
 * - When the rotation clears the session (definitive rejection) the request
 *   falls through to the unauthenticated handling below.
 * - When the rotation could not run but says nothing about the session
 *   (transport failure), the original error propagates WITHOUT the
 *   unauthenticated redirect — the user keeps their session.
 */
export const handleUnauthorizedError: UnauthorizedHandler = async (error: AxiosError) => {
  const config = error.config as RetriedRequestConfig | undefined;
  const authCall = isAuthEndpoint(config?.url);

  if (!config || authCall || config.__racRetriedAuth) {
    if (!authCall) {
      dropSessionAndRedirect();
    }
    throw error;
  }

  config.__racRetriedAuth = true;
  const tokenBefore = readSession()?.token ?? null;
  const rotated = await rotateSession();

  if (rotated && rotated.token !== tokenBefore) {
    config.headers.Authorization = `Bearer ${rotated.token}`;
    // Re-dispatch through the instance: the request interceptor re-applies
    // the persisted token and the response pipeline handles the result.
    return racApi.request(config);
  }

  if (readSession()) {
    throw error;
  }

  dropSessionAndRedirect();
  throw error;
};

/**
 * A session the backend definitively rejects is dropped and the app returns
 * to the login flow — but never while already on the login page: there a 401
 * is the stale-session probe or a failed login, and hard-navigating to the
 * page we are already on is the "force refresh" users saw. Login failures
 * themselves are handled by the login form.
 */
function dropSessionAndRedirect() {
  clearSession();
  if (typeof window === "undefined" || window.location.pathname === routes.login) {
    return;
  }
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // A hard navigation is deliberate: it drops every cache and store the way
  // a fresh load does, which is exactly what the unauthenticated recovery
  // wants (same pattern the interceptor used before the refresh flow).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${routes.login}?next=${next}`);
}

// The auth feature owns the refresh flow; rac-api stays free of feature
// imports and hands 401s over through this registration (wired at module
// load — the app-level AuthProvider always imports this module).
registerUnauthorizedHandler(handleUnauthorizedError);

function persistSession(session: Session) {
  // Sweep leftovers from the pre-cookie era (token + gate marker in JS storage).
  window.localStorage.removeItem("rac.token");
  document.cookie = "rac.auth=; Max-Age=0; Path=/";
  document.cookie = "rac_token=; Max-Age=0; Path=/";
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  scheduleProactiveRefresh();
  notifySessionChanged();
}

// External store so client components can read the session through
// useSyncExternalStore: the hydration render uses the server snapshot (no
// session) and the persisted value applies strictly afterwards as an update.
let cachedSession: Session | null | undefined;
let sessionEpoch = 0;
const sessionListeners = new Set<() => void>();

export function getSessionSnapshot(): Session | null {
  if (cachedSession === undefined) {
    cachedSession = readSession();
  }
  return cachedSession;
}

export function subscribeToSession(onChange: () => void): () => void {
  sessionListeners.add(onChange);
  scheduleProactiveRefresh();
  const onStorage = (event: StorageEvent) => {
    if (event.key === sessionStorageKey || event.key === null) {
      cachedSession = undefined;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    sessionListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
    if (sessionListeners.size === 0) {
      // The app (or the test) unmounted — stop the proactive timer with it.
      cancelProactiveRefresh();
    }
  };
}

function notifySessionChanged() {
  cachedSession = undefined;
  for (const listener of sessionListeners) {
    listener();
  }
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
