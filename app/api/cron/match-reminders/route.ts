import { autoConfirmExpiredMatches } from "@/lib/match/apply-match";
import { createServiceClient } from "@/lib/supabase/admin";
import { getUserEmail } from "@/lib/actions/auth";
import { sendMatchReminder } from "@/lib/email/send";
import { CONFIRMATION_HOURS } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = Date.now();
  const reminderWindowMs = (CONFIRMATION_HOURS - 2) * 60 * 60 * 1000;

  const { data: pending } = await admin
    .from("matches")
    .select("id, submitted_by, team1_ids, team2_ids, confirmation_deadline")
    .eq("status", "pending");

  let remindersSent = 0;

  for (const match of pending ?? []) {
    const deadline = new Date(match.confirmation_deadline).getTime();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
    if (hoursUntilDeadline > 2 || hoursUntilDeadline < 0) continue;

    const team1 = match.team1_ids as string[];
    const team2 = match.team2_ids as string[];
    const all = [...team1, ...team2].filter((id) => id !== match.submitted_by);

    const { data: submitter } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", match.submitted_by)
      .single();

    for (const opponentId of all) {
      const email = await getUserEmail(opponentId);
      if (!email) continue;
      const { data: opponent } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", opponentId)
        .single();

      await sendMatchReminder({
        toEmail: email,
        toName: opponent?.full_name ?? "Jugador",
        submitterName: submitter?.full_name ?? "Un jugador",
      });
      remindersSent++;
    }
  }

  const confirmed = await autoConfirmExpiredMatches();

  return NextResponse.json({ confirmed, remindersSent, reminderWindowMs });
}
