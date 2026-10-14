"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/shared/constants/routes";
import { readSession, resumeSession } from "../api/session-adapter";
import type { Session } from "../types";

/** Gives up on a wedged probe and continues into the app after this long. */
const RESUME_WATCHDOG_MS = 30_000;

/**
 * On the login page, bounces a visitor with a cached session to the dashboard
 * once the API confirms the session is still alive.
 */
export function useResumeSessionRedirect(session: Session | null) {
  const router = useRouter();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      return;
    }
    // The cached session isn't proof the server cookie is alive, so let the
    // API decide before bouncing an already-open login form back to the app.
    // resumeSession persists a new session object, which would re-run this
    // effect and cancel the very redirect it just requested, so the check
    // runs once per mount (checkedRef), not once per session identity.
    let cancelled = false;
    if (checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    // Watchdog: a wedged probe must never trap the user on the skeleton.
    // Afterwards continue into the app with whatever session is stored; the
    // 401 interceptor owns recovery from there.
    const watchdog = window.setTimeout(() => {
      if (!cancelled && readSession()) {
        router.replace(routes.dashboard);
      }
    }, RESUME_WATCHDOG_MS);

    resumeSession()
      .then((valid) => {
        if (!cancelled && valid) {
          router.replace(routes.dashboard);
        }
      })
      .catch(() => {
        // rotateSession settles its own failures; this guard only makes the
        // chain unfailable so the skeleton always resolves one way or another.
      })
      .finally(() => window.clearTimeout(watchdog));

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
  }, [router, session]);
}
