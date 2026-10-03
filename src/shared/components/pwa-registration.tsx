"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";
const SKIP_WAITING = { type: "SKIP_WAITING" } as const;

/**
 * Registers /sw.js once, in production only (dev/tests stay quiet), after the
 * page load event. Keeps updates seamless: whenever a new service worker is
 * waiting, it is told to SKIP_WAITING right away so the latest version takes
 * over without requiring a second visit. Renders nothing.
 */
export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const activateWaiting = (registration: ServiceWorkerRegistration) => {
      // A waiting worker only exists while an old one still controls the page,
      // so swapping immediately cannot interrupt a first-time install.
      if (registration.waiting && navigator.serviceWorker.controller) {
        registration.waiting.postMessage(SKIP_WAITING);
      }
    };

    const register = () => {
      navigator.serviceWorker
        .register(SW_URL, { scope: "/" })
        .then((registration) => {
          activateWaiting(registration);
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (installing) {
              installing.addEventListener("statechange", () => {
                if (installing.state === "installed") activateWaiting(registration);
              });
            }
          });
        })
        .catch((error: unknown) => {
          console.error("[pwa] service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
