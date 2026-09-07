"use server";

import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug } from "@/lib/community/context";
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

export async function getWeeklyStats(communitySlug: string): Promise<WeeklyStats> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) {
    return {
      totalMatches: 0,
      totalPlayers: 0,
      playedThisWeek: 0,
      playedIds: new Set(),
      notPlayed: [],
    };
  }

  const supabase = await createClient();
  const weekStart = getWeekStart().toISOString();

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, profile:profiles(*)")
    .eq("community_id", community.id);

  const all = (members ?? []).map((m) => m.profile as unknown as Profile);
  const totalPlayers = all.length;

  const { data: weekMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("community_id", community.id)
    .eq("status", "confirmed")
    .gte("created_at", weekStart);

  const { data: participants } = await supabase
    .from("match_participants")
    .select("user_id, matches!inner(status, created_at, community_id)")
    .eq("matches.status", "confirmed")
    .eq("matches.community_id", community.id)
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

export async function getRivalSuggestion(communitySlug: string, userId: string) {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return null;

  const supabase = await createClient();
  const weekStart = getWeekStart().toISOString();

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, rating, profile:profiles(*)")
    .eq("community_id", community.id);

  const profiles = (members ?? []).map((m) => ({
    ...(m.profile as unknown as Profile),
    rating: m.rating,
  }));

  const current = profiles.find((p) => p.id === userId);
  if (!current || !profiles.length) return null;

  const { data: weekParticipants } = await supabase
    .from("match_participants")
    .select("user_id, matches!inner(created_at, status, community_id)")
    .eq("matches.status", "confirmed")
    .eq("matches.community_id", community.id)
    .gte("matches.created_at", weekStart);

  const playedThisWeek = new Set((weekParticipants ?? []).map((p) => p.user_id));

  const { data: myRecent } = await supabase
    .from("match_participants")
    .select("match_id, matches!inner(community_id)")
    .eq("user_id", userId)
    .eq("matches.community_id", community.id)
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
    .select("match_id, team, matches!inner(community_id)")
    .eq("user_id", userId)
    .eq("matches.community_id", community.id);

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
