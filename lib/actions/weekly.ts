"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/share";
import type { Profile } from "@/types/database";

export type WeeklyStats = {
  totalMatches: number;
  totalPlayers: number;
  playedThisWeek: number;
  playedIds: Set<string>;
  notPlayed: Profile[];
};

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const supabase = await createClient();
  const weekStart = getWeekStart().toISOString();

  const { data: profiles } = await supabase.from("profiles").select("*");
  const all = profiles ?? [];

  const { data: weekMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "confirmed")
    .gte("created_at", weekStart);

  const { data: participants } = await supabase
    .from("match_participants")
    .select("user_id, matches!inner(status, created_at)")
    .eq("matches.status", "confirmed")
    .gte("matches.created_at", weekStart);

  const playedIds = new Set((participants ?? []).map((p) => p.user_id));
  const notPlayed = all.filter((p) => !playedIds.has(p.id));

  return {
    totalMatches: weekMatches?.length ?? 0,
    totalPlayers: all.length,
    playedThisWeek: playedIds.size,
    playedIds,
    notPlayed,
  };
}

export async function getRivalSuggestion(userId: string) {
  const supabase = await createClient();
  const weekStart = getWeekStart().toISOString();

  const { data: profiles } = await supabase.from("profiles").select("*");
  const current = profiles?.find((p) => p.id === userId);
  if (!current || !profiles?.length) return null;

  const { data: weekParticipants } = await supabase
    .from("match_participants")
    .select("user_id, matches!inner(created_at, status)")
    .eq("matches.status", "confirmed")
    .gte("matches.created_at", weekStart);

  const playedThisWeek = new Set((weekParticipants ?? []).map((p) => p.user_id));

  const { data: myRecent } = await supabase
    .from("match_participants")
    .select("match_id")
    .eq("user_id", userId)
    .order("match_id", { ascending: false })
    .limit(10);

  const recentMatchIds = new Set((myRecent ?? []).map((m) => m.match_id));
  const recentOpponents = new Set<string>();

  if (recentMatchIds.size) {
    const { data: oppParts } = await supabase
      .from("match_participants")
      .select("user_id, match_id")
      .in("match_id", Array.from(recentMatchIds))
      .neq("user_id", userId);

    for (const p of oppParts ?? []) {
      recentOpponents.add(p.user_id);
    }
  }

  const candidates = profiles
    .filter((p) => p.id !== userId)
    .filter((p) => !playedThisWeek.has(p.id))
    .map((p) => ({ profile: p, eloDiff: Math.abs(p.rating - current.rating) }))
    .sort((a, b) => a.eloDiff - b.eloDiff);

  return candidates[0] ?? null;
}
