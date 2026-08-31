import { createHash, randomBytes } from "crypto";

export function randomSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSignUp(input: {
  name: string;
  email: string;
  password: string;
}): string | null {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (name.length < 2) return "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email.";
  }
  if (input.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}
