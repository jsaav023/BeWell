export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

const USERS_KEY = "bewell-users-v1";
const SESSION_KEY = "bewell-session-v1";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(userId: string | null): void {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

export function getUserById(id: string): PublicUser | null {
  const user = readUsers().find((u) => u.id === id);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string };

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, user]);
  setSessionUserId(user.id);

  return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
}

export async function logIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const user = readUsers().find((u) => u.email === email);
  if (!user) return { ok: false, error: "Incorrect email or password." };

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) {
    return { ok: false, error: "Incorrect email or password." };
  }

  setSessionUserId(user.id);
  return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
}

export function logOut(): void {
  setSessionUserId(null);
}
