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
  getSessionUserId,
  getUserById,
  logIn as authLogIn,
  logOut as authLogOut,
  signUp as authSignUp,
  type PublicUser,
} from "@/lib/auth";

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
  logOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    const id = getSessionUserId();
    setUser(id ? getUserById(id) : null);
    setReady(true);
  }, []);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const result = await authSignUp(input);
      if (!result.ok) return result;
      setUser(result.user);
      return { ok: true as const };
    },
    [],
  );

  const logIn = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await authLogIn(input);
      if (!result.ok) return result;
      setUser(result.user);
      return { ok: true as const };
    },
    [],
  );

  const logOut = useCallback(() => {
    authLogOut();
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
