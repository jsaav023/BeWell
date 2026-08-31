"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BeeBrand } from "@/components/BeeBrand";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const { logIn, signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = isSignup
        ? await signUp({ name, email, password })
        : await logIn({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <header className="mb-10 text-center">
        <BeeBrand className="justify-center" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {isSignup
            ? "Sign up to keep your cycle private to you."
            : "Log in to continue tracking your cycle."}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="auth-card bee-card space-y-4 rounded-[1.75rem] bg-[var(--surface)]/90 p-6"
      >
        {isSignup && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Name
            </span>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Your name"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@email.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Password
          </span>
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
          />
        </label>

        {error && (
          <p className="rounded-2xl bg-[var(--pink-soft)] px-3 py-2 text-sm text-[var(--accent-deep)]" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={pending}>
          {pending
            ? isSignup
              ? "Creating account…"
              : "Logging in…"
            : isSignup
              ? "Sign up"
              : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
