"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/share";
import { suggestRivalOfTheWeek, type H2HRecord } from "@/lib/rival";
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
  const { data: roster } = await supabase.from("roster_players").select("id, claimed_by");
  const all = profiles ?? [];
  const totalPlayers = roster?.length ?? all.length;

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
    totalPlayers,
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

  const { data: myParts } = await supabase
    .from("match_participants")
    .select("match_id, team")
    .eq("user_id", userId);

  const h2hByOpponent: Record<string, H2HRecord> = {};
  if (myParts?.length) {
    const { data: allOppParts } = await supabase
      .from("match_participants")
      .select("user_id, match_id, team")
      .in(
        "match_id",
        myParts.map((p) => p.match_id)
      )
      .neq("user_id", userId);

    const myByMatch = Object.fromEntries(myParts.map((p) => [p.match_id, p.team]));
    for (const opp of allOppParts ?? []) {
      const myTeam = myByMatch[opp.match_id];
      if (!myTeam) continue;
      if (!h2hByOpponent[opp.user_id]) h2hByOpponent[opp.user_id] = { wins: 0, losses: 0 };
      if (myTeam === "winner") h2hByOpponent[opp.user_id].wins++;
      else h2hByOpponent[opp.user_id].losses++;
    }
  }

  return (
    suggestRivalOfTheWeek(
      current,
      profiles,
      playedThisWeek,
      recentOpponents,
      h2hByOpponent
    ) ?? candidates[0] ?? null
  );
}
