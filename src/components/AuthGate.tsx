"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && isPublic) {
      router.replace("/");
    }
  }, [ready, user, isPublic, router]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Redirecting…
      </div>
    );
  }

  if (user && isPublic) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
