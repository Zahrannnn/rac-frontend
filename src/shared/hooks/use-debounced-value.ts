"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` only after it has stayed unchanged for `delayMs`
 * (trailing-edge debounce). Keeps rapid keystroke drafts out of query keys.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
