"use server";

import { createClient } from "@/lib/supabase/server";
import { getOpponentIds, getTeammateIds } from "@/lib/match/participants";
import type { Match, MatchFormat } from "@/types/database";

export type OpponentRecord = {
  id: string;
  full_name: string;
  wins: number;
  losses: number;
  diff: number;
};

export type PartnerRecord = {
  id: string;
  full_name: string;
  matches: number;
  wins: number;
  winRate: number;
};

export type ProfileStats = {
  mostPlayedOpponent: OpponentRecord | null;
  hijos: OpponentRecord[];
  padres: OpponentRecord[];
  favoritePartner: PartnerRecord | null;
  totalConfirmedMatches: number;
};

type H2HAccumulator = {
  wins: number;
  losses: number;
  matchCount: number;
  singlesCount: number;
};

type PartnerAccumulator = {
  matches: number;
  wins: number;
};

function isSingles(format: MatchFormat): boolean {
  return format.startsWith("1v1_");
}

function isDoubles(format: MatchFormat): boolean {
  return format.startsWith("2v2_");
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("match_participants")
    .select(`
      team,
      matches (
        id,
        format,
        status,
        winner_ids,
        loser_ids,
        team1_ids,
        team2_ids
      )
    `)
    .eq("user_id", userId);

  const h2hByOpponent = new Map<string, H2HAccumulator>();
  const partnerStats = new Map<string, PartnerAccumulator>();
  let totalConfirmedMatches = 0;

  for (const row of participations ?? []) {
    const match = row.matches as unknown as Match | null;
    if (!match?.id || match.status !== "confirmed") continue;

    totalConfirmedMatches++;
    const userWon = row.team === "winner";
    const format = match.format as MatchFormat;

    for (const oppId of getOpponentIds(match, userId)) {
      const acc = h2hByOpponent.get(oppId) ?? {
        wins: 0,
        losses: 0,
        matchCount: 0,
        singlesCount: 0,
      };
      acc.matchCount++;
      if (isSingles(format)) acc.singlesCount++;
      if (userWon) acc.wins++;
      else acc.losses++;
      h2hByOpponent.set(oppId, acc);
    }

    if (isDoubles(format)) {
      for (const partnerId of getTeammateIds(match, userId)) {
        const acc = partnerStats.get(partnerId) ?? { matches: 0, wins: 0 };
        acc.matches++;
        if (userWon) acc.wins++;
        partnerStats.set(partnerId, acc);
      }
    }
  }

  const allProfileIds = new Set([
    ...Array.from(h2hByOpponent.keys()),
    ...Array.from(partnerStats.keys()),
  ]);

  const nameMap = new Map<string, string>();
  if (allProfileIds.size) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(allProfileIds));
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.full_name);
    }
  }

  const opponentRecords: OpponentRecord[] = Array.from(h2hByOpponent.entries()).map(
    ([id, acc]) => ({
      id,
      full_name: nameMap.get(id) ?? "?",
      wins: acc.wins,
      losses: acc.losses,
      diff: acc.wins - acc.losses,
    })
  );

  let mostPlayedOpponent: OpponentRecord | null = null;
  for (const [id, acc] of Array.from(h2hByOpponent.entries())) {
    const record: OpponentRecord = {
      id,
      full_name: nameMap.get(id) ?? "?",
      wins: acc.wins,
      losses: acc.losses,
      diff: acc.wins - acc.losses,
    };
    if (!mostPlayedOpponent) {
      mostPlayedOpponent = record;
      continue;
    }
    const currentAcc = h2hByOpponent.get(mostPlayedOpponent.id)!;
    const preferSingles =
      acc.singlesCount > currentAcc.singlesCount ||
      (acc.singlesCount === currentAcc.singlesCount &&
        acc.matchCount > currentAcc.matchCount);
    const preferTotal =
      acc.singlesCount === 0 &&
      currentAcc.singlesCount === 0 &&
      acc.matchCount > currentAcc.matchCount;
    if (preferSingles || preferTotal) {
      mostPlayedOpponent = record;
    } else if (
      acc.singlesCount === currentAcc.singlesCount &&
      acc.matchCount === currentAcc.matchCount &&
      record.diff > mostPlayedOpponent.diff
    ) {
      mostPlayedOpponent = record;
    }
  }

  const hijos = opponentRecords
    .filter((r) => r.diff >= 3)
    .sort((a, b) => b.diff - a.diff || b.wins + b.losses - (a.wins + a.losses));

  const padres = opponentRecords
    .filter((r) => r.diff <= -3)
    .sort((a, b) => a.diff - b.diff || b.wins + b.losses - (a.wins + a.losses));

  let favoritePartner: PartnerRecord | null = null;
  for (const [id, acc] of Array.from(partnerStats.entries())) {
    const record: PartnerRecord = {
      id,
      full_name: nameMap.get(id) ?? "?",
      matches: acc.matches,
      wins: acc.wins,
      winRate: acc.matches ? Math.round((acc.wins / acc.matches) * 100) : 0,
    };
    if (
      !favoritePartner ||
      record.matches > favoritePartner.matches ||
      (record.matches === favoritePartner.matches && record.winRate > favoritePartner.winRate)
    ) {
      favoritePartner = record;
    }
  }

  return {
    mostPlayedOpponent,
    hijos,
    padres,
    favoritePartner,
    totalConfirmedMatches,
  };
}
