import { describe, expect, it } from "vitest";
import { mergePublicEnv } from "./env";

describe("mergePublicEnv", () => {
  it("lets the runtime config fill values the build left undefined", () => {
    const merged = mergePublicEnv(
      {
        NEXT_PUBLIC_APP_NAME: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NEXT_PUBLIC_SHOW_HEALTH_URLS: undefined,
        NEXT_PUBLIC_RAC_API_BASE_URL: undefined,
      },
      { NEXT_PUBLIC_RAC_API_BASE_URL: "https://api.example.com/api/v1" }
    );
    expect(merged.NEXT_PUBLIC_RAC_API_BASE_URL).toBe("https://api.example.com/api/v1");
    expect(merged.NEXT_PUBLIC_APP_NAME).toBeUndefined();
  });

  it("keeps a defined build-time/.env value over the runtime config", () => {
    const merged = mergePublicEnv(
      {
        NEXT_PUBLIC_APP_NAME: undefined,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_SHOW_HEALTH_URLS: "true",
        NEXT_PUBLIC_RAC_API_BASE_URL: "http://localhost:5161/api/v1",
      },
      { NEXT_PUBLIC_RAC_API_BASE_URL: "https://api.example.com/api/v1" }
    );
    // Local development: .env.local wins so the committed production config
    // never hijacks the localhost API target.
    expect(merged.NEXT_PUBLIC_RAC_API_BASE_URL).toBe("http://localhost:5161/api/v1");
    expect(merged.NEXT_PUBLIC_SHOW_HEALTH_URLS).toBe("true");
  });

  it("returns the process env untouched without a runtime config", () => {
    const processEnv = {
      NEXT_PUBLIC_APP_NAME: "RAC-DAMP",
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SHOW_HEALTH_URLS: undefined,
      NEXT_PUBLIC_RAC_API_BASE_URL: undefined,
    };
    expect(mergePublicEnv(processEnv)).toEqual(processEnv);
  });
});
