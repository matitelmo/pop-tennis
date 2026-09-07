"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug } from "@/lib/community/context";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { getWeekStart } from "@/lib/share";
import { pairingKey } from "@/lib/match/participants";
import {
  buildRankedPlayers,
  computeWeeklyPairings,
  getCooldownWeekStarts,
} from "@/lib/weekly-match";
import { hasActiveSubscription } from "@/lib/subscription";
import type { Profile } from "@/types/database";

export type WeeklyMatchAssignment = {
  opponent: Profile;
  userRank: number;
  opponentRank: number;
  rankDiff: number;
  playedThisWeek: boolean;
  optedIn: boolean;
};

function weekStartToDate(weekStart: Date): string {
  return weekStart.toISOString().slice(0, 10);
}

async function loadCooldownPairs(
  communityId: string,
  weekStartDate: string
): Promise<Set<string>> {
  const admin = createServiceClient();
  const cooldownWeeks = getCooldownWeekStarts(new Date(weekStartDate + "T12:00:00"));
  const cooldownPairs = new Set<string>();

  if (cooldownWeeks.length) {
    const { data: pastPairings } = await admin
      .from("weekly_match_pairings")
      .select("user_id, opponent_id")
      .eq("community_id", communityId)
      .in("week_start", cooldownWeeks);

    for (const row of pastPairings ?? []) {
      cooldownPairs.add(pairingKey(row.user_id, row.opponent_id));
    }
  }

  return cooldownPairs;
}

export async function setWeeklyOptIn(
  communitySlug: string,
  optIn: boolean
): Promise<{ success: boolean; error?: string }> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const admin = createServiceClient();
  const { data: member } = await admin
    .from("community_members")
    .select("subscription_status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  if (!member) return { success: false, error: "No sos miembro de esta comunidad" };

  if (community.settings.requires_subscription && !hasActiveSubscription(member)) {
    return { success: false, error: "Necesitás suscripción activa para el rival semanal" };
  }

  await admin
    .from("community_members")
    .update({ weekly_opt_in: optIn })
    .eq("community_id", community.id)
    .eq("user_id", user.id);

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}

export async function ensureWeeklyPairings(
  communityId: string,
  weekStart = getWeekStart()
): Promise<void> {
  const admin = createServiceClient();
  const weekStartDate = weekStartToDate(weekStart);

  const { data: community } = await admin
    .from("communities")
    .select("settings")
    .eq("id", communityId)
    .single();

  if (!community) return;

  const settings = community.settings as { weekly_rival_mode?: string };
  const mode = settings.weekly_rival_mode ?? "auto";

  const { count } = await admin
    .from("weekly_match_pairings")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("week_start", weekStartDate);

  if (count && count > 0) return;

  let membersQuery = admin
    .from("community_members")
    .select("user_id, rating, weekly_opt_in, subscription_status")
    .eq("community_id", communityId);

  if (mode === "opt_in") {
    membersQuery = membersQuery.eq("weekly_opt_in", true);
  }

  const { data: members } = await membersQuery;

  const eligible = (members ?? []).filter((m) => {
    if (mode === "auto") return true;
    return hasActiveSubscription(m) || !settings;
  });

  if (!eligible.length) return;

  const ranked = buildRankedPlayers(
    eligible.map((m) => ({ id: m.user_id, rating: m.rating }))
  );
  const cooldownPairs = await loadCooldownPairs(communityId, weekStartDate);
  const pairings = computeWeeklyPairings(ranked, cooldownPairs);

  const rows: {
    week_start: string;
    user_id: string;
    opponent_id: string;
    community_id: string;
  }[] = [];
  for (const [userId, opponentId] of Array.from(pairings.entries())) {
    rows.push({
      week_start: weekStartDate,
      user_id: userId,
      opponent_id: opponentId,
      community_id: communityId,
    });
  }

  if (rows.length) {
    await admin.from("weekly_match_pairings").insert(rows);
  }
}

export async function getWeeklyMatchForUser(
  communitySlug: string,
  userId: string
): Promise<WeeklyMatchAssignment | null> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return null;

  const supabase = await createClient();
  const weekStart = getWeekStart();
  const weekStartDate = weekStartToDate(weekStart);

  const { data: member } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", community.id)
    .eq("user_id", userId)
    .single();

  if (!member) return null;

  const mode = community.settings.weekly_rival_mode;
  if (mode === "off") return null;
  if (mode === "opt_in" && !member.weekly_opt_in) return null;

  await ensureWeeklyPairings(community.id, weekStart);

  const { data: pairing } = await supabase
    .from("weekly_match_pairings")
    .select("opponent_id")
    .eq("community_id", community.id)
    .eq("week_start", weekStartDate)
    .eq("user_id", userId)
    .maybeSingle();

  if (!pairing) return null;

  const [{ data: opponent }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", pairing.opponent_id).single(),
    supabase
      .from("community_members")
      .select("user_id, rating, weekly_opt_in, subscription_status")
      .eq("community_id", community.id)
      .order("rating", { ascending: false }),
  ]);

  if (!opponent || !members?.length) return null;

  const ranked = buildRankedPlayers(
    members.map((m) => ({ id: m.user_id, rating: m.rating }))
  );
  const userRanked = ranked.find((p) => p.id === userId);
  const opponentRanked = ranked.find((p) => p.id === opponent.id);
  if (!userRanked || !opponentRanked) return null;

  const weekStartIso = weekStart.toISOString();
  const { data: weekParticipants } = await supabase
    .from("match_participants")
    .select("match_id, user_id, matches!inner(status, created_at, community_id)")
    .eq("matches.status", "confirmed")
    .eq("matches.community_id", community.id)
    .gte("matches.created_at", weekStartIso)
    .in("user_id", [userId, opponent.id]);

  const userMatchIds = new Set(
    (weekParticipants ?? [])
      .filter((p) => p.user_id === userId)
      .map((p) => p.match_id)
  );
  const playedThisWeek = (weekParticipants ?? []).some(
    (p) => p.user_id === opponent.id && userMatchIds.has(p.match_id)
  );

  return {
    opponent,
    userRank: userRanked.rank,
    opponentRank: opponentRanked.rank,
    rankDiff: Math.abs(userRanked.rank - opponentRanked.rank),
    playedThisWeek,
    optedIn: member.weekly_opt_in,
  };
}

export async function isWeeklyMatchOpponent(
  communityId: string,
  userId: string,
  opponentIds: string[]
): Promise<boolean> {
  if (opponentIds.length !== 1) return false;

  const admin = createServiceClient();
  const { data: community } = await admin
    .from("communities")
    .select("slug")
    .eq("id", communityId)
    .single();

  if (!community) return false;

  const assignment = await getWeeklyMatchForUser(community.slug, userId);
  return assignment?.opponent.id === opponentIds[0];
}
