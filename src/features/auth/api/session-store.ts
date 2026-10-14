import { sessionStorageKey } from "../constants/session";
import type { Session } from "../types";
import { cancelProactiveRefresh, scheduleProactiveRefresh } from "./token-rotation";

// Circular import with token-rotation is deliberate and safe: persist/clear/
// subscribe arm or cancel the rotation timer, while the rotation reads and
// writes the session through this module. Every cross-module reference is a
// hoisted function declaration called at runtime — no module-initialization
// code touches the other side.

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

export function persistSession(session: Session) {
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

/** Monotonic generation counter — a logout invalidates in-flight rotations. */
export function getSessionEpoch(): number {
  return sessionEpoch;
}

function notifySessionChanged() {
  cachedSession = undefined;
  for (const listener of sessionListeners) {
    listener();
  }
}
