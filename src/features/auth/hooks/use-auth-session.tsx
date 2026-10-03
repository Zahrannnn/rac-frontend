"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  getSessionSnapshot,
  loginWithSession,
  logoutSession,
  subscribeToSession,
} from "../api/session-adapter";
import type { AuthUser, LoginInput, Session } from "../types";

type AuthContextValue = {
  /**
   * Null in the server render and the hydration render; the persisted session
   * is adopted through useSyncExternalStore right after hydration.
   */
  session: Session | null;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getServerSession = () => null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSession
  );

  const login = useCallback(async (input: LoginInput) => {
    await loginWithSession(input);
  }, []);

  // The JWT lives only in this browser — revoking the refresh token
  // server-side (best-effort, never blocking) plus clearing the local cache
  // is the whole logout.
  const logout = useCallback(async () => {
    logoutSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, login, logout }),
    [login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
