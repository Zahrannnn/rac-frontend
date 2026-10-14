/**
 * Public session API for the auth feature. The implementation lives in
 * focused modules beside this barrel:
 *
 * - session-store           — localStorage read/write + useSyncExternalStore state
 * - token-rotation          — single-flight POST /auth/refresh + proactive timer
 * - refresh-lock            — cross-tab Web Locks / localStorage mutex
 * - unauthorized-interceptor— 401 refresh-and-retry handler (wired into rac-api)
 * - session-lifecycle       — login, logout, refresh and the boot resume probe
 *
 * Keep importing from this file: consumers (and LoginPage's test mock) key on
 * this module path, and the interceptor registration below runs when it loads.
 */
export {
  loginWithSession,
  logoutSession,
  refreshSession,
  resumeSession,
} from "./session-lifecycle";
export {
  clearSession,
  getSessionSnapshot,
  readSession,
  subscribeToSession,
} from "./session-store";
export { rotateSession } from "./token-rotation";
export { handleUnauthorizedError } from "./unauthorized-interceptor";
