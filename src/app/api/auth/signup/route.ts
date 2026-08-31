import { NextResponse } from "next/server";
import {
  hashPassword,
  normalizeEmail,
  randomSalt,
  validateSignUp,
} from "@/lib/server/password";
import { setSessionCookie } from "@/lib/server/session";
import {
  createUser,
  getUserByEmail,
  toPublicUser,
} from "@/lib/server/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    const validationError = validateSignUp({ name, email, password });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const salt = randomSalt();
    const user = await createUser({
      name,
      email,
      passwordHash: hashPassword(password, salt),
      salt,
    });

    await setSessionCookie(user.id);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("signup failed", error);
    return NextResponse.json(
      { error: "Could not create account. Try again." },
      { status: 500 },
    );
  }
}
