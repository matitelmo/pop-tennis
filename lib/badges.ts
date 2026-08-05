"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import {
  COMPETITIVE_BADGE_CODES,
  computeCompetitiveBadgeHolders,
  type MatchRecord,
} from "@/lib/badge-awards";
import type { BadgeCode, SetScore } from "@/types/database";
import { GHOST_INACTIVE_DAYS } from "@/lib/constants";

async function fetchConfirmedMatchRecords(): Promise<MatchRecord[]> {
  const supabase = createServiceClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      created_at,
      set_scores,
      winner_ids,
      loser_ids,
      match_participants (
        user_id,
        team,
        rating_before
      )
    `
    )
    .eq("status", "confirmed");

  if (error) {
    console.error("fetchConfirmedMatchRecords:", error.message);
    return [];
  }

  return (matches ?? []).map((match) => ({
    id: match.id,
    created_at: match.created_at,
    set_scores: match.set_scores as SetScore[],
    winner_ids: match.winner_ids as string[],
    loser_ids: match.loser_ids as string[],
    participants: (match.match_participants ?? []).map((participant) => ({
      user_id: participant.user_id,
      team: participant.team as "winner" | "loser",
      rating_before: participant.rating_before,
    })),
  }));
}

async function setCompetitiveBadgeHolders(
  badgeCode: BadgeCode,
  userIds: string[]
) {
  const supabase = createServiceClient();
  await supabase.from("user_badges").delete().eq("badge_code", badgeCode);

  if (!userIds.length) return;

  await supabase.from("user_badges").insert(
    userIds.map((userId) => ({
      user_id: userId,
      badge_code: badgeCode,
    }))
  );
}

export async function recalculateCompetitiveBadges() {
  const matches = await fetchConfirmedMatchRecords();
  const holders = computeCompetitiveBadgeHolders(matches);

  for (const badgeCode of COMPETITIVE_BADGE_CODES) {
    await setCompetitiveBadgeHolders(badgeCode, holders[badgeCode]);
  }
}

export async function checkAndAwardBadges() {
  await recalculateCompetitiveBadges();
}

export async function checkGhostBadgeForUser(userId: string) {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_match_at")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const days = Math.floor(
    (Date.now() - new Date(profile.last_match_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_code", "sello_fantasma")
    .maybeSingle();

  if (days >= GHOST_INACTIVE_DAYS) {
    if (!existing) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_code: "sello_fantasma",
      });
    }
    return;
  }

  if (existing) {
    await supabase.from("user_badges").delete().eq("id", existing.id);
  }
}
