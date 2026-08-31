import { NextResponse } from "next/server";
import { hashPassword, normalizeEmail } from "@/lib/server/password";
import { setSessionCookie } from "@/lib/server/session";
import { getUserByEmail, toPublicUser } from "@/lib/server/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);
    if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    }

    await setSessionCookie(user.id);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("login failed", error);
    return NextResponse.json(
      { error: "Could not log in. Try again." },
      { status: 500 },
    );
  }
}
