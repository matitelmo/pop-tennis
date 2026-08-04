"use server";

import { createClient } from "@/lib/supabase/server";
import type { RatingHistoryPoint } from "@/types/database";

export async function getRatingHistory(userId: string): Promise<RatingHistoryPoint[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, base_rating")
    .eq("id", userId)
    .single();

  if (!profile) return [];

  const { data: participants } = await supabase
    .from("match_participants")
    .select("rating_after, matches!inner(created_at, status)")
    .eq("user_id", userId)
    .eq("matches.status", "confirmed");

  const sorted = (participants ?? []).sort((a, b) => {
    const dateA = (a.matches as unknown as { created_at: string }).created_at;
    const dateB = (b.matches as unknown as { created_at: string }).created_at;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const points: RatingHistoryPoint[] = [
    { date: profile.created_at, rating: profile.base_rating },
  ];

  for (const row of sorted) {
    const match = row.matches as unknown as { created_at: string } | null;
    if (!match?.created_at) continue;
    points.push({ date: match.created_at, rating: row.rating_after });
  }

  return points;
}
