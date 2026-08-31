export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string };

async function parseAuthResponse(response: Response): Promise<AuthResult> {
  const body = (await response.json()) as { user?: PublicUser; error?: string };
  if (!response.ok) {
    return { ok: false, error: body.error ?? "Something went wrong." };
  }
  if (!body.user) {
    return { ok: false, error: "Something went wrong." };
  }
  return { ok: true, user: body.user };
}

export async function fetchSession(): Promise<PublicUser | null> {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { user: PublicUser | null };
  return body.user;
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseAuthResponse(response);
}

export async function logIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseAuthResponse(response);
}

export async function logOut(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
