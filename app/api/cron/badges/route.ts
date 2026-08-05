import { NextResponse } from "next/server";
import { recalculateCompetitiveBadges } from "@/lib/badges";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await recalculateCompetitiveBadges();
  return NextResponse.json({ ok: true });
}
