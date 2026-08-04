import { NextResponse } from "next/server";
import { calculateDecay } from "@/lib/decay";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: profiles, error } = await supabase.from("profiles").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const results = [];

  for (const profile of profiles ?? []) {
    const decay = calculateDecay({
      rating: profile.rating,
      baseRating: profile.base_rating,
      lastMatchAt: new Date(profile.last_match_at),
      lastDecayAt: profile.last_decay_at ? new Date(profile.last_decay_at) : null,
      now,
    });

    if (!decay) continue;

    await supabase
      .from("profiles")
      .update({
        rating: decay.newRating,
        last_decay_at: now.toISOString(),
      })
      .eq("id", profile.id);

    results.push({ userId: profile.id, ...decay });
  }

  return NextResponse.json({ processed: results.length, results });
}
