import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/server/session";
import { getUserById, toPublicUser } from "@/lib/server/users";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("session failed", error);
    return NextResponse.json({ user: null });
  }
}
