import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { normalizeApiError } from "./http-client";

const sessionCacheKey = "rac.session";
const loginPath = "/auth/login";

export const racApi: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_RAC_API_BASE_URL || undefined,
  // The hosted backend sleeps when idle; the first call after idle can take
  // tens of seconds, so the ceiling stays generous (session calls retry).
  timeout: 20_000,
  headers: { Accept: "application/json" },
});

// The JWT rides the Authorization header from the cached session. Bearer
// auth (instead of cookies) is what keeps the session working in private
// windows and under third-party-cookie blocking on the split-origin deploy.
racApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    const raw = window.localStorage.getItem(sessionCacheKey);
    const token = raw ? (JSON.parse(raw) as { token?: string }).token : undefined;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No readable session — send the request unauthenticated.
  }
  return config;
});

racApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // A session the backend rejects (expired/invalid token) is dropped from
    // local storage so the app returns to the login flow — but NEVER while
    // already on the login page: there a 401 is either the stale-session
    // probe or the post-login verification, and hard-navigating to the page
    // we are already on is the "force refresh" users saw. Login failures
    // themselves are handled by the login form.
    if (status === 401 && !error.config?.url?.includes(loginPath)) {
      if (typeof window !== "undefined" && window.location.pathname === "/auth/login") {
        return Promise.reject(normalizeApiError(error));
      }

      window.localStorage.removeItem(sessionCacheKey);
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.assign(`/auth/login?next=${next}`);
    }

    return Promise.reject(normalizeApiError(error));
  }
);
