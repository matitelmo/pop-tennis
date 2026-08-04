"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import type { BadgeCode, MatchFormat, SetScore } from "@/types/database";

type MatchContext = {
  matchId: string;
  format: MatchFormat;
  setScores: SetScore[];
  winnerIds: string[];
  loserIds: string[];
  ratingsBefore: Record<string, number>;
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

async function getHeadToHeadWinStreak(
  winnerId: string,
  opponentId: string
): Promise<number> {
  const supabase = createServiceClient();

  const { data: myParts } = await supabase
    .from("match_participants")
    .select("match_id, team")
    .eq("user_id", winnerId);

  if (!myParts?.length) return 0;

  const { data: oppParts } = await supabase
    .from("match_participants")
    .select("match_id")
    .eq("user_id", opponentId);

  const oppMatchIds = new Set((oppParts ?? []).map((p) => p.match_id));
  const shared = myParts.filter((p) => oppMatchIds.has(p.match_id));

  if (!shared.length) return 0;

  const { data: matches } = await supabase
    .from("matches")
    .select("id, created_at")
    .in(
      "id",
      shared.map((s) => s.match_id)
    )
    .order("created_at", { ascending: false });

  let streak = 0;
  for (const match of matches ?? []) {
    const part = shared.find((s) => s.match_id === match.id);
    if (part?.team === "winner") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function checkAndAwardBadges(context: MatchContext) {
  const supabase = createServiceClient();

  for (const winnerId of context.winnerIds) {
    for (const loserId of context.loserIds) {
      const winnerRating = context.ratingsBefore[winnerId] ?? 0;
      const loserRating = context.ratingsBefore[loserId] ?? 0;
      if (loserRating - winnerRating >= 300) {
        await awardBadge(winnerId, "caza_gigantes");
      }

      const streak = await getHeadToHeadWinStreak(winnerId, loserId);
      if (streak >= 5) {
        await awardBadge(winnerId, "papa_del_grupo");
      }
    }

    if (context.format.endsWith("bo5")) {
      const winnerSets = context.setScores.filter((s) => s.p1 > s.p2).length;
      if (winnerSets === 3 && context.setScores.length === 3) {
        await awardBadge(winnerId, "paseo_en_coche");
      }
    }

    if (context.setScores.some((s) => s.p1 === 6 && s.p2 === 0)) {
      await awardBadge(winnerId, "inviolable");
    }

    const { data: recentMatches } = await supabase
      .from("match_participants")
      .select("matches(created_at)")
      .eq("user_id", winnerId);

    const now = new Date();
    const weekMatches = (recentMatches ?? []).filter((m) => {
      const matchData = m.matches as unknown as { created_at: string } | null;
      if (!matchData?.created_at) return false;
      const created = new Date(matchData.created_at);
      return (
        created.getFullYear() === now.getFullYear() &&
        getISOWeek(created) === getISOWeek(now)
      );
    });

    if (weekMatches.length >= 5) {
      await awardBadge(winnerId, "lomo_de_metal");
    }
  }
}
