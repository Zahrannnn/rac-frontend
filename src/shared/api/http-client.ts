import axios, { AxiosError, type AxiosInstance } from "axios";

export type ApiServiceKey = "core" | "billing" | "reporting";

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  /** Raw response body (e.g. the duplicate list on a 409 conflict). */
  data?: unknown;
  /**
   * Field-level validation messages from a ProblemDetails body whose `errors`
   * dictionary maps a field/contract key to an array of messages (400 responses).
   * Forms read this to render messages next to the offending input.
   */
  fieldErrors?: Record<string, string[]>;
};

const clients = new Map<ApiServiceKey, AxiosInstance>();

export function createHttpClient(baseURL?: string) {
  const client = axios.create({
    baseURL,
    timeout: 8000,
    headers: {
      Accept: "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
      return Promise.reject(normalizeApiError(error));
    }
  );

  return client;
}

export function getHttpClient(key: ApiServiceKey, baseURL?: string) {
  if (!clients.has(key)) {
    clients.set(key, createHttpClient(baseURL));
  }

  return clients.get(key)!;
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<{ message?: string; detail?: string; code?: string; title?: string; errors?: Record<string, string[]> }>(error)) {
    const body = error.response?.data;
    return {
      message:
        body?.detail ??
        body?.message ??
        error.message ??
        "The request could not be completed.",
      status: error.response?.status,
      code: body?.code,
      data: error.response?.data,
      fieldErrors: body?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "An unknown API error occurred." };
}
