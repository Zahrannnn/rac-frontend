import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";
import { normalizeApiError } from "./http-client";

const sessionCacheKey = "rac.session";

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

/**
 * The auth feature (session-adapter) owns the refresh-token flow and
 * installs the 401 single-flight refresh-and-retry handler through this
 * slot; rac-api stays free of feature imports. The slot is wired when the
 * session-adapter module loads, which the app-level AuthProvider always
 * triggers.
 */
export type UnauthorizedHandler = (error: AxiosError) => Promise<unknown>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

// Registered BEFORE the error normalizer below, so the refresh handler sees
// the raw AxiosError — normalization strips the request config the retry
// needs, and the raw error still flows into the normalizer afterwards.
racApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only a 401 can be recovered by rotating the refresh token.
    if (unauthorizedHandler && error.response?.status === 401 && error.config) {
      return unauthorizedHandler(error);
    }
    return Promise.reject(error);
  }
);

racApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeApiError(error))
);
