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
  const routerRef = useRef(router);
  const mountedRef = useRef(false);
  const probeStartedRef = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Tracks real unmounts only. A per-run `cancelled` flag would also fire when
  // the effect below re-runs (resumeSession stores a new session object, and
  // StrictMode replays effects), cancelling the redirect of the single probe.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // The cached session isn't proof the server cookie is alive, so let the
    // API decide before bouncing an already-open login form back to the app.
    if (!session || probeStartedRef.current) {
      return;
    }
    probeStartedRef.current = true;

    const redirectIfMounted = () => {
      if (mountedRef.current) {
        routerRef.current.replace(routes.dashboard);
      }
    };

    // Watchdog: a wedged probe must never trap the user on the skeleton.
    // Afterwards continue into the app with whatever session is stored; the
    // 401 interceptor owns recovery from there.
    const watchdog = window.setTimeout(() => {
      if (readSession()) {
        redirectIfMounted();
      }
    }, RESUME_WATCHDOG_MS);

    resumeSession()
      .then((valid) => {
        if (valid) {
          redirectIfMounted();
        }
      })
      .catch(() => {
        // rotateSession settles its own failures; this guard only makes the
        // chain unfailable so the skeleton always resolves one way or another.
      })
      .finally(() => window.clearTimeout(watchdog));
  }, [session]);
}
