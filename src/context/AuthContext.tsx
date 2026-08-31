"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchSession,
  logIn as apiLogIn,
  logOut as apiLogOut,
  signUp as apiSignUp,
  type PublicUser,
} from "@/lib/auth-client";
import { syncLocalStateToAccount } from "@/lib/storage";

type AuthContextValue = {
  ready: boolean;
  user: PublicUser | null;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logIn: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    fetchSession()
      .then(setUser)
      .finally(() => setReady(true));
  }, []);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const result = await apiSignUp(input);
      if (!result.ok) return result;
      setUser(result.user);
      await syncLocalStateToAccount(result.user.id);
      return { ok: true as const };
    },
    [],
  );

  const logIn = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await apiLogIn(input);
      if (!result.ok) return result;
      setUser(result.user);
      await syncLocalStateToAccount(result.user.id);
      return { ok: true as const };
    },
    [],
  );

  const logOut = useCallback(async () => {
    await apiLogOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, user, signUp, logIn, logOut }),
    [ready, user, signUp, logIn, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
