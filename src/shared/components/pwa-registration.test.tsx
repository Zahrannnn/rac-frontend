import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { PwaRegistration } from "./pwa-registration";

type RegistrationStub = {
  waiting: { postMessage: ReturnType<typeof vi.fn> } | null;
  installing: null;
  addEventListener: ReturnType<typeof vi.fn>;
};

/**
 * jsdom has no serviceWorker; install a controllable stub on the navigator.
 * readyState is forced to "complete" so the component registers immediately
 * instead of waiting for a load event jsdom already fired.
 */
function installServiceWorkerStub(registration: RegistrationStub | Promise<RegistrationStub>) {
  const register = vi.fn(() => Promise.resolve(registration));
  Object.defineProperty(document, "readyState", {
    value: "complete",
    configurable: true,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    value: { register, controller: {} },
    configurable: true,
  });
  return register;
}

afterEach(() => {
  cleanup();
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  Reflect.deleteProperty(document, "readyState");
  vi.unstubAllEnvs();
});

describe("PwaRegistration", () => {
  it("does not touch navigator.serviceWorker outside production", async () => {
    // vitest runs with NODE_ENV=test — the guard must bail before registering.
    const register = installServiceWorkerStub({
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    });

    render(<PwaRegistration />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(register).not.toHaveBeenCalled();
  });

  it("registers /sw.js with root scope in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = installServiceWorkerStub({
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    });

    render(<PwaRegistration />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledOnce();
    });
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("tells a waiting service worker to SKIP_WAITING for seamless updates", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const postMessage = vi.fn();
    const register = installServiceWorkerStub({
      waiting: { postMessage },
      installing: null,
      addEventListener: vi.fn(),
    });

    render(<PwaRegistration />);

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });
    expect(register).toHaveBeenCalledOnce();
  });
});
