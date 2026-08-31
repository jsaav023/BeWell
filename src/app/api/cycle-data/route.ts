import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/server/session";
import { getCycleData, saveCycleData } from "@/lib/server/users";
import type { AppState } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/cycle";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getCycleData(userId);
    return NextResponse.json({
      data: data ?? {
        cycles: [],
        days: {},
        settings: { ...DEFAULT_SETTINGS },
      },
    });
  } catch (error) {
    console.error("load cycle data failed", error);
    return NextResponse.json(
      { error: "Could not load your data." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { data?: AppState };
    if (!body.data) {
      return NextResponse.json({ error: "Missing data." }, { status: 400 });
    }

    const data: AppState = {
      cycles: body.data.cycles ?? [],
      days: body.data.days ?? {},
      settings: { ...DEFAULT_SETTINGS, ...body.data.settings },
    };

    await saveCycleData(userId, data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save cycle data failed", error);
    return NextResponse.json(
      { error: "Could not save your data." },
      { status: 500 },
    );
  }
}
