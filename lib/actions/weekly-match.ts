"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getWeekStart } from "@/lib/share";
import { pairingKey } from "@/lib/match/participants";
import {
  buildRankedPlayers,
  computeWeeklyPairings,
  getCooldownWeekStarts,
} from "@/lib/weekly-match";
import type { Profile } from "@/types/database";

export type WeeklyMatchAssignment = {
  opponent: Profile;
  userRank: number;
  opponentRank: number;
  rankDiff: number;
  playedThisWeek: boolean;
};

function weekStartToDate(weekStart: Date): string {
  return weekStart.toISOString().slice(0, 10);
}

async function loadCooldownPairs(weekStartDate: string): Promise<Set<string>> {
  const admin = createServiceClient();
  const cooldownWeeks = getCooldownWeekStarts(new Date(weekStartDate + "T12:00:00"));
  const cooldownPairs = new Set<string>();

  if (cooldownWeeks.length) {
    const { data: pastPairings } = await admin
      .from("weekly_match_pairings")
      .select("user_id, opponent_id")
      .in("week_start", cooldownWeeks);

    for (const row of pastPairings ?? []) {
      cooldownPairs.add(pairingKey(row.user_id, row.opponent_id));
    }
  }

  return cooldownPairs;
}

export async function ensureWeeklyPairings(weekStart = getWeekStart()): Promise<void> {
  const admin = createServiceClient();
  const weekStartDate = weekStartToDate(weekStart);

  const { count } = await admin
    .from("weekly_match_pairings")
    .select("*", { count: "exact", head: true })
    .eq("week_start", weekStartDate);

  if (count && count > 0) return;

  const { data: profiles } = await admin.from("profiles").select("id, rating");
  if (!profiles?.length) return;

  const ranked = buildRankedPlayers(profiles);
  const cooldownPairs = await loadCooldownPairs(weekStartDate);
  const pairings = computeWeeklyPairings(ranked, cooldownPairs);

  const rows: { week_start: string; user_id: string; opponent_id: string }[] = [];
  for (const [userId, opponentId] of Array.from(pairings.entries())) {
    rows.push({
      week_start: weekStartDate,
      user_id: userId,
      opponent_id: opponentId,
    });
  }

  if (rows.length) {
    await admin.from("weekly_match_pairings").insert(rows);
  }
}

export async function getWeeklyMatchForUser(
  userId: string
): Promise<WeeklyMatchAssignment | null> {
  const supabase = await createClient();
  const weekStart = getWeekStart();
  const weekStartDate = weekStartToDate(weekStart);

  await ensureWeeklyPairings(weekStart);

  const { data: pairing } = await supabase
    .from("weekly_match_pairings")
    .select("opponent_id")
    .eq("week_start", weekStartDate)
    .eq("user_id", userId)
    .maybeSingle();

  if (!pairing) return null;

  const [{ data: opponent }, { data: profiles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", pairing.opponent_id).single(),
    supabase.from("profiles").select("id, rating").order("rating", { ascending: false }),
  ]);

  if (!opponent || !profiles?.length) return null;

  const ranked = buildRankedPlayers(profiles);
  const userRanked = ranked.find((p) => p.id === userId);
  const opponentRanked = ranked.find((p) => p.id === opponent.id);
  if (!userRanked || !opponentRanked) return null;

  const weekStartIso = weekStart.toISOString();
  const { data: weekParticipants } = await supabase
    .from("match_participants")
    .select("match_id, user_id, matches!inner(status, created_at)")
    .eq("matches.status", "confirmed")
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
  };
}

export async function isWeeklyMatchOpponent(
  userId: string,
  opponentIds: string[]
): Promise<boolean> {
  if (opponentIds.length !== 1) return false;
  const assignment = await getWeeklyMatchForUser(userId);
  return assignment?.opponent.id === opponentIds[0];
}
