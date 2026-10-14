import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { racApi, registerUnauthorizedHandler, type UnauthorizedHandler } from "@/shared/api/rac-api";
import { routes } from "@/shared/constants/routes";
import { clearSession, readSession } from "./session-store";
import { rotateSession } from "./token-rotation";

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
