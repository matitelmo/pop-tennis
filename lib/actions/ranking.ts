"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { syncCommunityRatings } from "@/lib/match/sync-ratings";
import { getCommunityBySlug } from "@/lib/community/context";
import type {
  GenderFilter,
  LeaderboardView,
  Profile,
  RosterPlayer,
  SubscriptionStatus,
  SkillLevel,
} from "@/types/database";
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
  isUnclaimed?: boolean;
};

type CommunityMatchRow = {
  id: string;
  created_at: string;
  winner_ids: string[];
  loser_ids: string[];
  rating_changes: Record<string, number> | null;
  team1_ids: string[] | null;
  team2_ids: string[] | null;
};

function matchIncludesPlayer(match: CommunityMatchRow, playerId: string): boolean {
  if (match.winner_ids?.includes(playerId) || match.loser_ids?.includes(playerId)) {
    return true;
  }
  if (match.team1_ids?.includes(playerId) || match.team2_ids?.includes(playerId)) {
    return true;
  }
  return Boolean(match.rating_changes && playerId in match.rating_changes);
}

function collectRosterIdsFromMatches(
  matches: CommunityMatchRow[],
  excludeIds: Set<string>
): string[] {
  const ids = new Set<string>();
  for (const match of matches) {
    for (const id of [
      ...(match.team1_ids ?? []),
      ...(match.team2_ids ?? []),
      ...(match.winner_ids ?? []),
      ...(match.loser_ids ?? []),
      ...Object.keys(match.rating_changes ?? {}),
    ]) {
      if (!excludeIds.has(id)) ids.add(id);
    }
  }
  return Array.from(ids);
}

function buildUnclaimedRosterEntry(
  roster: RosterPlayer,
  matches: CommunityMatchRow[],
  monthStart: string,
  quarterStart: string
): LeaderboardEntry {
  const playerId = roster.id;
  const playerMatches = matches.filter((match) => matchIncludesPlayer(match, playerId));

  const ratingDeltaTotal = playerMatches.reduce(
    (sum, match) => sum + (match.rating_changes?.[playerId] ?? 0),
    0
  );

  const sorted = [...playerMatches].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const streak = sorted
    .slice(0, 5)
    .map((match) => (match.winner_ids.includes(playerId) ? ("W" as const) : ("L" as const)));

  const monthStartTime = new Date(monthStart).getTime();
  const quarterStartTime = new Date(quarterStart).getTime();
  let monthlyDelta = 0;
  let quarterlyDelta = 0;
  const monthlyMatchIds = new Set<string>();

  for (const match of playerMatches) {
    const playedAt = new Date(match.created_at).getTime();
    const delta = match.rating_changes?.[playerId] ?? 0;
    if (playedAt >= quarterStartTime) quarterlyDelta += delta;
    if (playedAt >= monthStartTime) {
      monthlyDelta += delta;
      monthlyMatchIds.add(match.id);
    }
  }

  const lastMatchAt = sorted[0]?.created_at ?? roster.created_at;
  const playNudge = getPlayNudgeDays(lastMatchAt);

  return {
    id: roster.id,
    full_name: roster.display_name,
    avatar_url: null,
    skill_level: roster.suggested_skill_level as SkillLevel,
    gender: null,
    rating: roster.suggested_rating + ratingDeltaTotal,
    base_rating: roster.suggested_rating,
    last_match_at: lastMatchAt,
    last_decay_at: null,
    created_at: roster.created_at,
    roster_player_id: roster.id,
    last_seen_rank: null,
    last_seen_at: null,
    subscription_status: "none",
    stripe_customer_id: null,
    weekly_opt_in: false,
    availability: null,
    phone_number: null,
    streak,
    monthlyDelta,
    monthlyMatches: monthlyMatchIds.size,
    quarterlyDelta,
    isGhost: playNudge.type === "ghost",
    playNudge,
    isFrozen: false,
    isUnclaimed: true,
  };
}

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

  const admin = createServiceClient();
  const { data: communityMatches } = await admin
    .from("matches")
    .select("id, created_at, winner_ids, loser_ids, rating_changes, team1_ids, team2_ids")
    .eq("community_id", community.id)
    .eq("status", "confirmed");

  const typedMatches = (communityMatches ?? []) as CommunityMatchRow[];
  const profileIds = new Set(profileEntries.map((entry) => entry.id));

  let rosterRows: RosterPlayer[] = [];
  if (isRosterCommunity) {
    const { data } = await admin
      .from("roster_players")
      .select("*")
      .eq("community_id", community.id)
      .is("claimed_by", null);
    rosterRows = (data ?? []) as RosterPlayer[];
  } else {
    const rosterIds = collectRosterIdsFromMatches(typedMatches, profileIds);
    if (rosterIds.length) {
      const { data } = await admin
        .from("roster_players")
        .select("*")
        .in("id", rosterIds)
        .is("claimed_by", null);
      rosterRows = (data ?? []) as RosterPlayer[];
    }
  }

  for (const roster of rosterRows) {
    if (profileIds.has(roster.id)) continue;
    profileEntries.push(
      buildUnclaimedRosterEntry(roster, typedMatches, monthStart, quarterStart)
    );
  }

  if (showQuarterly && view === "quarterly") {
    return profileEntries.sort((a, b) => b.quarterlyDelta - a.quarterlyDelta);
  }

  return profileEntries.sort((a, b) => b.rating - a.rating);
}
