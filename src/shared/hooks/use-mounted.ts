import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True only after the component's own hydration commit. Gate auth-derived UI
 * on this when the component renders inside a deferred (Suspense) boundary:
 * the server HTML and the hydration render must agree, and the session store
 * may otherwise update while a boundary is still hydrating. React guarantees
 * the server snapshot is used while hydrating, so the flip is a safe update.
 */
export function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
