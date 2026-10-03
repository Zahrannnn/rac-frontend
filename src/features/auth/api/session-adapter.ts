import { racApi } from "@/shared/api/rac-api";
import { sessionStorageKey } from "../constants/session";
import type { AuthUser, LoginInput, Session } from "../types";

type LoginResponse = {
  accessToken: string;
  expiresAtUtc: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: AuthUser["role"];
    isActive: boolean;
  };
};

type MeResponse = AuthUser;

/**
 * POST /auth/login then GET /auth/me. The returned JWT is persisted in the
 * local session and sent as the Authorization header on every API call —
 * the deployed backend and frontend live on different sites, where browsers
 * block or drop cross-site cookies.
 */
export async function loginWithSession(input: LoginInput): Promise<Session> {
  const { data: login } = await withColdStartRetry(
    () =>
      racApi.post<LoginResponse>("/auth/login", {
        usernameOrEmail: input.usernameOrEmail,
        password: input.password,
      }),
    2
  );

  let me: MeResponse;
  try {
    // The token is not in the persisted session yet, so this call must carry
    // it explicitly — otherwise the probe goes out unauthenticated and 401s.
    ({ data: me } = await withColdStartRetry(
      () =>
        racApi.get<MeResponse>("/auth/me", {
          headers: { Authorization: `Bearer ${login.accessToken}` },
        }),
      3
    ));
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      // The credentials were already accepted above; a 401 from the session
      // probe is a server-side inconsistency (e.g. a waking gateway), not a
      // wrong password — surface it as a server problem so the login form
      // never claims the credentials were wrong.
      throw Object.assign(error as object, { status: 503 });
    }
    throw error;
  }

  const session: Session = {
    token: login.accessToken,
    expiresAtUtc: login.expiresAtUtc,
    user: me,
  };
  persistSession(session);
  return session;
}

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

    if (
      session.token &&
      session.user?.permissions &&
      new Date(session.expiresAtUtc).getTime() > Date.now()
    ) {
      return session;
    }
  } catch {
    // fall through to cleanup
  }

  window.localStorage.removeItem(sessionStorageKey);
  return null;
}

export function clearSession() {
  window.localStorage.removeItem(sessionStorageKey);
  notifySessionChanged();
}

/** Re-checks the cached session against the server; clears it when rejected. */
export async function refreshSession(): Promise<Session | null> {
  const cached = readSession();
  if (!cached) {
    return null;
  }

  try {
    const { data: me } = await withColdStartRetry(() => racApi.get<MeResponse>("/auth/me"), 3);
    const session: Session = {
      token: cached.token,
      expiresAtUtc: cached.expiresAtUtc,
      user: me,
    };
    // Notify subscribers only when something actually changed — re-persisting
    // an identical session would re-render every consumer for nothing.
    if (JSON.stringify(session) !== JSON.stringify(cached)) {
      persistSession(session);
    }
    return session;
  } catch (error) {
    // A definitive 401 means the session is dead. A transport failure
    // (timeout / unreachable server — e.g. the hosted backend waking from
    // idle) says nothing about the session: keep the user logged in and let
    // the data calls surface their own retryable error states.
    if ((error as { status?: number }).status === 401) {
      clearSession();
      return null;
    }
    return cached;
  }
}

function persistSession(session: Session) {
  // Sweep leftovers from the pre-cookie era (token + gate marker in JS storage).
  window.localStorage.removeItem("rac.token");
  document.cookie = "rac.auth=; Max-Age=0; Path=/";
  document.cookie = "rac_token=; Max-Age=0; Path=/";
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  notifySessionChanged();
}

// External store so client components can read the session through
// useSyncExternalStore: the hydration render uses the server snapshot (no
// session) and the persisted value applies strictly afterwards as an update.
let cachedSession: Session | null | undefined;
const sessionListeners = new Set<() => void>();

export function getSessionSnapshot(): Session | null {
  if (cachedSession === undefined) {
    cachedSession = readSession();
  }
  return cachedSession;
}

export function subscribeToSession(onChange: () => void): () => void {
  sessionListeners.add(onChange);
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
