"use server";

import { createClient } from "@/lib/supabase/server";
import { getAllRosterPlayers } from "@/lib/actions/roster";
import type { Profile, SkillLevel } from "@/types/database";
import { getPlayNudgeDays } from "@/lib/rival";

export type LeaderboardEntry = Profile & {
  streak: ("W" | "L")[];
  monthlyDelta: number;
  monthlyMatches: number;
  isGhost: boolean;
  playNudge: { type: "none" | "nudge" | "ghost"; days: number };
  isUnclaimed?: boolean;
};

function unclaimedRosterToEntry(roster: {
  id: string;
  display_name: string;
  suggested_skill_level: string;
  suggested_rating: number;
  created_at: string;
}): LeaderboardEntry {
  return {
    id: roster.id,
    full_name: roster.display_name,
    avatar_url: null,
    skill_level: roster.suggested_skill_level as SkillLevel,
    rating: roster.suggested_rating,
    base_rating: roster.suggested_rating,
    last_match_at: roster.created_at,
    last_decay_at: null,
    created_at: roster.created_at,
    roster_player_id: roster.id,
    last_seen_rank: null,
    last_seen_at: null,
    streak: [],
    monthlyDelta: 0,
    monthlyMatches: 0,
    isGhost: false,
    playNudge: { type: "none", days: 0 },
    isUnclaimed: true,
  };
}

async function buildProfileEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
  monthStart: string
): Promise<LeaderboardEntry> {
  const { data: recent } = await supabase
    .from("match_participants")
    .select("team, matches(created_at, status)")
    .eq("user_id", profile.id);

  const streak = (recent ?? [])
    .filter((r) => {
      const match = r.matches as unknown as { status: string } | null;
      return match?.status === "confirmed";
    })
    .sort((a, b) => {
      const dateA = new Date(
        (a.matches as unknown as { created_at: string })?.created_at ?? 0
      ).getTime();
      const dateB = new Date(
        (b.matches as unknown as { created_at: string })?.created_at ?? 0
      ).getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((r) => (r.team === "winner" ? ("W" as const) : ("L" as const)));

  const { data: monthly } = await supabase
    .from("match_participants")
    .select("rating_delta, match_id, matches!inner(created_at, status)")
    .eq("user_id", profile.id)
    .eq("matches.status", "confirmed")
    .gte("matches.created_at", monthStart);

  const monthlyDelta = (monthly ?? []).reduce((sum, m) => sum + m.rating_delta, 0);
  const monthlyMatchIds = new Set((monthly ?? []).map((m) => m.match_id));
  const monthlyMatches = monthlyMatchIds.size;
  const playNudge = getPlayNudgeDays(profile.last_match_at);

  return {
    ...profile,
    streak,
    monthlyDelta,
    monthlyMatches,
    isGhost: playNudge.type === "ghost",
    playNudge,
    isUnclaimed: false,
  };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const [{ data: profiles, error: profilesError }, roster] = await Promise.all([
    supabase.from("profiles").select("*"),
    getAllRosterPlayers(),
  ]);

  if (profilesError) {
    console.error("getLeaderboard profiles:", profilesError.message);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const profileEntries = await Promise.all(
    (profiles ?? []).map((profile) => buildProfileEntry(supabase, profile, monthStart))
  );

  const claimedRosterIds = new Set(
    (profiles ?? []).map((p) => p.roster_player_id).filter(Boolean) as string[]
  );

  const unclaimedEntries = roster
    .filter((r) => !r.claimed_by && !claimedRosterIds.has(r.id))
    .map(unclaimedRosterToEntry);

  return [...profileEntries, ...unclaimedEntries].sort((a, b) => b.rating - a.rating);
}
