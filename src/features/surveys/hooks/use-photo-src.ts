"use client";

import { useEffect, useState } from "react";
import { fetchPhotoBlob } from "../api/surveys-adapter";

/**
 * Loads one auth-required survey photo through the authenticated API client and
 * exposes it as an object URL for <img> rendering. A plain <img src> pointing at
 * the endpoint can never attach the Bearer header — every preview 401'd (§11).
 * The object URL revokes on unmount/re-fetch so blobs never leak.
 */
export function usePhotoSrc(
  surveyId: string,
  photoId: string
): { src: string | null; isError: boolean } {
  const [state, setState] = useState<{ src: string | null; isError: boolean }>({
    src: null,
    isError: false,
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    // No synchronous reset here (react-hooks flags cascading renders) — PhotoThumb
    // mounts once per photo id, so a stale src never crosses instances.

    fetchPhotoBlob(surveyId, photoId)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setState({ src: objectUrl, isError: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ src: null, isError: true });
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [surveyId, photoId]);

  return state;
}
