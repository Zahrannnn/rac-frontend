import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("RAC-DAMP"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SHOW_HEALTH_URLS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_RAC_API_BASE_URL: z.string().url().optional().or(z.literal("")),
});

type PublicEnvInput = {
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_SHOW_HEALTH_URLS?: string;
  NEXT_PUBLIC_RAC_API_BASE_URL?: string;
};

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: PublicEnvInput;
  }
}

function readPublicEnv(): PublicEnvInput {
  const processEnv: PublicEnvInput = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SHOW_HEALTH_URLS: process.env.NEXT_PUBLIC_SHOW_HEALTH_URLS,
    NEXT_PUBLIC_RAC_API_BASE_URL: process.env.NEXT_PUBLIC_RAC_API_BASE_URL,
  };

  if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) {
    return mergePublicEnv(processEnv, window.__RUNTIME_CONFIG__);
  }

  return processEnv;
}

/**
 * Build-time/.env values that are actually DEFINED win (so a developer's
 * .env.local is never overridden by a committed runtime config); the runtime
 * config fills everything the build left undefined (e.g. the production
 * API base on hosts that build without environment variables).
 */
export function mergePublicEnv(
  processEnv: PublicEnvInput,
  runtimeConfig?: PublicEnvInput
): PublicEnvInput {
  if (!runtimeConfig) {
    return processEnv;
  }
  const defined = Object.fromEntries(
    Object.entries(processEnv).filter(([, value]) => value !== undefined)
  );
  return { ...runtimeConfig, ...defined };
}

const parsed = publicEnvSchema.safeParse(readPublicEnv());

if (!parsed.success) {
  console.error("[env] Invalid public env, falling back to defaults:", parsed.error.issues);
}

export const env = parsed.success ? parsed.data : publicEnvSchema.parse({});

export const backendServices = [
  {
    key: "rac-api",
    label: "RAC API",
    baseUrl: env.NEXT_PUBLIC_RAC_API_BASE_URL,
  },
] as const;
