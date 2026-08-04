"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import type { BadgeCode, MatchFormat, SetScore } from "@/types/database";
import { GHOST_INACTIVE_DAYS } from "@/lib/constants";

type MatchContext = {
  matchId: string;
  format: MatchFormat;
  setScores: SetScore[];
  winnerIds: string[];
  loserIds: string[];
  ratingsBefore: Record<string, number>;
  team1Won: boolean;
  rawSetScores: SetScore[];
};

async function hasBadge(userId: string, badgeCode: BadgeCode): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_code", badgeCode)
    .maybeSingle();
  return !!data;
}

async function awardBadge(userId: string, badgeCode: BadgeCode) {
  if (await hasBadge(userId, badgeCode)) return;
  const supabase = createServiceClient();
  await supabase.from("user_badges").insert({ user_id: userId, badge_code: badgeCode });
}

async function getHeadToHeadRecord(
  userId: string,
  opponentId: string
): Promise<{ wins: number; losses: number }> {
  const supabase = createServiceClient();

  const { data: myParts } = await supabase
    .from("match_participants")
    .select("match_id, team")
    .eq("user_id", userId);

  const { data: oppParts } = await supabase
    .from("match_participants")
    .select("match_id")
    .eq("user_id", opponentId);

  const oppMatchIds = new Set((oppParts ?? []).map((p) => p.match_id));
  const shared = (myParts ?? []).filter((p) => oppMatchIds.has(p.match_id));

  let wins = 0;
  let losses = 0;
  for (const p of shared) {
    if (p.team === "winner") wins++;
    else losses++;
  }
  return { wins, losses };
}

function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

export async function checkAndAwardBadges(context: MatchContext) {
  const supabase = createServiceClient();
  const now = new Date();

  for (const winnerId of context.winnerIds) {
    for (const loserId of context.loserIds) {
      const winnerRating = context.ratingsBefore[winnerId] ?? 0;
      const loserRating = context.ratingsBefore[loserId] ?? 0;
      if (loserRating - winnerRating >= 300) {
        await awardBadge(winnerId, "caza_gigantes");
      }

      const h2h = await getHeadToHeadRecord(winnerId, loserId);
      if (h2h.wins - h2h.losses >= 3) {
        await awardBadge(winnerId, "papa_de_la_banda");
      }
    }

    if (context.setScores.some((s) => s.p1 === 6 && s.p2 === 0)) {
      await awardBadge(winnerId, "zapatero");
    }

    const raw = context.rawSetScores;
    if (raw.length >= 1) {
      const firstSet = raw[0];
      const lostFirst = context.team1Won ? firstSet.p2 > firstSet.p1 : firstSet.p1 > firstSet.p2;
      if (lostFirst) {
        await awardBadge(winnerId, "el_yacare");
      }
    }

    const { data: fridayMatches } = await supabase
      .from("match_participants")
      .select("match_id, matches!inner(created_at, status)")
      .eq("user_id", winnerId)
      .eq("matches.status", "confirmed");

    const fridayCount = (fridayMatches ?? []).filter((m) => {
      const matchData = m.matches as unknown as { created_at: string } | null;
      if (!matchData?.created_at) return false;
      return isFriday(new Date(matchData.created_at));
    }).length;

    if (isFriday(now) && fridayCount >= 2) {
      await awardBadge(winnerId, "viernes_flex");
    }
  }
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
  if (days >= GHOST_INACTIVE_DAYS) {
    await awardBadge(userId, "sello_fantasma");
  }
}
