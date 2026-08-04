import { NextResponse } from "next/server";
import { autoConfirmExpiredMatches } from "@/lib/match/apply-match";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const confirmed = await autoConfirmExpiredMatches();

  return NextResponse.json({ confirmed });
}
