"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { syncCommunityRatings } from "@/lib/match/sync-ratings";
import { getCommunityBySlug } from "@/lib/community/context";
import type { GenderFilter, LeaderboardView, Profile, SubscriptionStatus, SkillLevel } from "@/types/database";
import { getPlayNudgeDays } from "@/lib/rival";

export type LeaderboardEntry = Profile & {
  rating: number;
  streak: ("W" | "L")[];
  monthlyDelta: number;
  monthlyMatches: number;
  quarterlyDelta: number;
  isGhost: boolean;
  playNudge: { type: "none" | "nudge" | "ghost"; days: number };
  isFrozen: boolean;
  subscription_status: SubscriptionStatus;
  weekly_opt_in: boolean;
  last_match_at: string;
};

function getQuarterStart(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1).toISOString();
}

async function buildProfileEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
  member: {
    rating: number;
    subscription_status: SubscriptionStatus;
    weekly_opt_in: boolean;
    last_match_at: string;
  },
  communityId: string,
  monthStart: string,
  quarterStart: string
): Promise<LeaderboardEntry> {
  const { data: recent } = await supabase
    .from("match_participants")
    .select("team, matches(created_at, status, community_id)")
    .eq("user_id", profile.id);

  const streak = (recent ?? [])
    .filter((r) => {
      const match = r.matches as unknown as { status: string; community_id: string } | null;
      return match?.status === "confirmed" && match.community_id === communityId;
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
    .select("rating_delta, match_id, matches!inner(created_at, status, community_id)")
    .eq("user_id", profile.id)
    .eq("matches.status", "confirmed")
    .eq("matches.community_id", communityId)
    .gte("matches.created_at", monthStart);

  const { data: quarterly } = await supabase
    .from("match_participants")
    .select("rating_delta, matches!inner(created_at, status, community_id)")
    .eq("user_id", profile.id)
    .eq("matches.status", "confirmed")
    .eq("matches.community_id", communityId)
    .gte("matches.created_at", quarterStart);

  const monthlyDelta = (monthly ?? []).reduce((sum, m) => sum + m.rating_delta, 0);
  const monthlyMatchIds = new Set((monthly ?? []).map((m) => m.match_id));
  const monthlyMatches = monthlyMatchIds.size;
  const quarterlyDelta = (quarterly ?? []).reduce((sum, m) => sum + m.rating_delta, 0);
  const playNudge = getPlayNudgeDays(member.last_match_at);

  return {
    ...profile,
    rating: member.rating,
    subscription_status: member.subscription_status,
    weekly_opt_in: member.weekly_opt_in,
    last_match_at: member.last_match_at,
    streak,
    monthlyDelta,
    monthlyMatches,
    quarterlyDelta,
    isGhost: playNudge.type === "ghost",
    playNudge,
    isFrozen:
      member.subscription_status === "past_due" || member.subscription_status === "canceled",
  };
}

export type LeaderboardOptions = {
  communitySlug: string;
  gender?: GenderFilter;
  view?: LeaderboardView;
};

export async function getLeaderboard(
  options: LeaderboardOptions
): Promise<LeaderboardEntry[]> {
  const community = await getCommunityBySlug(options.communitySlug);
  if (!community) return [];

  await syncCommunityRatings(community.id);

  const supabase = await createClient();
  const gender = options.gender;
  const view = options.view ?? "alltime";
  const showGenderSplit = community.settings.leaderboard_gender_split;
  const showQuarterly = community.settings.leaderboard_quarterly_view;

  const [{ data: members, error: membersError }, { data: activeRows }] = await Promise.all([
    supabase
      .from("community_members")
      .select("*, profile:profiles(*)")
      .eq("community_id", community.id),
    supabase
      .from("match_participants")
      .select("user_id, matches!inner(status, community_id)")
      .eq("matches.status", "confirmed")
      .eq("matches.community_id", community.id),
  ]);

  if (membersError) {
    console.error("getLeaderboard members:", membersError.message);
  }

  const activePlayerIds = new Set((activeRows ?? []).map((row) => row.user_id));
  const isRosterCommunity = community.settings.signup_mode === "roster";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const quarterStart = getQuarterStart();

  const profileEntries = await Promise.all(
    (members ?? [])
      .filter((row) => {
        const profile = row.profile as unknown as Profile;
        if (isRosterCommunity) return true;
        return activePlayerIds.has(profile.id);
      })
      .filter((row) => {
        const profile = row.profile as unknown as Profile;
        return !showGenderSplit || !gender || profile.gender === gender;
      })
      .map((row) => {
        const profile = row.profile as unknown as Profile;
        return buildProfileEntry(
          supabase,
          profile,
          {
            rating: row.rating,
            subscription_status: row.subscription_status,
            weekly_opt_in: row.weekly_opt_in,
            last_match_at: row.last_match_at,
          },
          community.id,
          monthStart,
          quarterStart
        );
      })
  );

  if (isRosterCommunity) {
    const admin = createServiceClient();
    const { data: rosterRows } = await admin
      .from("roster_players")
      .select("*")
      .eq("community_id", community.id)
      .is("claimed_by", null);

    for (const roster of rosterRows ?? []) {
      profileEntries.push({
        id: roster.id,
        full_name: roster.display_name,
        avatar_url: null,
        skill_level: roster.suggested_skill_level as SkillLevel,
        gender: null,
        rating: roster.suggested_rating,
        base_rating: roster.suggested_rating,
        last_match_at: now.toISOString(),
        last_decay_at: null,
        created_at: roster.created_at,
        roster_player_id: roster.id,
        last_seen_rank: null,
        last_seen_at: null,
        subscription_status: "none",
        stripe_customer_id: null,
        weekly_opt_in: false,
        availability: null,
        streak: [],
        monthlyDelta: 0,
        monthlyMatches: 0,
        quarterlyDelta: 0,
        isGhost: false,
        playNudge: { type: "none", days: 0 },
        isFrozen: false,
      });
    }
  }

  if (showQuarterly && view === "quarterly") {
    return profileEntries.sort((a, b) => b.quarterlyDelta - a.quarterlyDelta);
  }

  return profileEntries.sort((a, b) => b.rating - a.rating);
}
