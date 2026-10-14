// ---------------------------------------------------------------------------
// Cross-tab refresh lock
// ---------------------------------------------------------------------------

const refreshLockName = "rac.session.refresh";
const refreshLockStorageKey = "rac.session.refresh.lock";
/** Stolen after this long — a tab that died mid-rotation must not deadlock the rest. */
const refreshLockStaleMs = 10_000;
const refreshLockWaitMs = 10_000;

type WebLockManagerLike = {
  request?: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
};

/**
 * Rotations are racy across tabs: tab B presenting tab A's just-rotated
 * token gets a 401 (the backend treats the replay as a plain 401). The lock
 * serializes tabs; the stored-token re-read inside makes the loser adopt the
 * winner's result instead of replaying.
 */
export async function withRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & { locks?: WebLockManagerLike }).locks;

  if (typeof locks?.request === "function") {
    return locks.request(refreshLockName, operation);
  }
  return withLocalStorageLock(operation);
}

/**
 * localStorage mutex for browsers without Web Locks. Acquisition is not
 * atomic across tabs, but the rotation's stored-token re-read plus the
 * replay-401 guard cover the residual race.
 */
async function withLocalStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const lockId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + refreshLockWaitMs;

  while (!acquireLocalStorageLock(lockId)) {
    if (Date.now() >= deadline) {
      // Best-effort mutex: proceed rather than deadlock.
      return operation();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  try {
    return await operation();
  } finally {
    releaseLocalStorageLock(lockId);
  }
}

function acquireLocalStorageLock(lockId: string): boolean {
  const now = Date.now();
  let lock: { id?: string; expiresAt?: number } | null = null;
  try {
    const raw = window.localStorage.getItem(refreshLockStorageKey);
    lock = raw ? (JSON.parse(raw) as { id?: string; expiresAt?: number }) : null;
  } catch {
    lock = null; // malformed lock entry — steal it
  }
  if (lock?.id && lock.expiresAt && lock.expiresAt > now) {
    return false; // another tab holds a live lock
  }
  window.localStorage.setItem(
    refreshLockStorageKey,
    JSON.stringify({ id: lockId, expiresAt: now + refreshLockStaleMs })
  );
  return true;
}

function releaseLocalStorageLock(lockId: string) {
  try {
    const raw = window.localStorage.getItem(refreshLockStorageKey);
    const lock = raw ? (JSON.parse(raw) as { id?: string }) : null;
    // Release only a lock we still own — a stolen/expired entry may already
    // belong to another tab.
    if (lock?.id === lockId) {
      window.localStorage.removeItem(refreshLockStorageKey);
    }
  } catch {
    window.localStorage.removeItem(refreshLockStorageKey);
  }
}
