"use server";

import { createClient } from "@/lib/supabase/server";
import { syncProfileRatings } from "@/lib/match/sync-ratings";
import type { Profile } from "@/types/database";
import { getPlayNudgeDays } from "@/lib/rival";

export type LeaderboardEntry = Profile & {
  streak: ("W" | "L")[];
  monthlyDelta: number;
  monthlyMatches: number;
  isGhost: boolean;
  playNudge: { type: "none" | "nudge" | "ghost"; days: number };
};

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
  };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  await syncProfileRatings();

  const supabase = await createClient();

  const [{ data: profiles, error: profilesError }, { data: activeRows }] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase
      .from("match_participants")
      .select("user_id, matches!inner(status)")
      .eq("matches.status", "confirmed"),
  ]);

  if (profilesError) {
    console.error("getLeaderboard profiles:", profilesError.message);
  }

  const activePlayerIds = new Set((activeRows ?? []).map((row) => row.user_id));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const profileEntries = await Promise.all(
    (profiles ?? [])
      .filter((profile) => activePlayerIds.has(profile.id))
      .map((profile) => buildProfileEntry(supabase, profile, monthStart))
  );

  return profileEntries.sort((a, b) => b.rating - a.rating);
}
