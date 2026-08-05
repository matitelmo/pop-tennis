import type { SetScore } from "@/types/database";

export type MatchParticipantRecord = {
  user_id: string;
  team: "winner" | "loser";
  rating_before: number;
};

export type MatchRecord = {
  id: string;
  created_at: string;
  set_scores: SetScore[];
  winner_ids: string[];
  loser_ids: string[];
  participants: MatchParticipantRecord[];
};

export function getPreviousCalendarMonthRange(now = new Date()): {
  start: Date;
  end: Date;
} {
  const year = now.getFullYear();
  const month = now.getMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const start = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
  const end = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function winnersFromCounts(counts: Map<string, number>): string[] {
  const values = Array.from(counts.values());
  let max = 0;
  for (const count of values) {
    max = Math.max(max, count);
  }
  if (max <= 0) return [];
  return Array.from(counts.entries())
    .filter(([, count]) => count === max)
    .map(([id]) => id);
}

export function computePequenoCharles(
  matches: MatchRecord[],
  now = new Date()
): string[] {
  const { start, end } = getPreviousCalendarMonthRange(now);
  const counts = new Map<string, number>();

  for (const match of matches) {
    const playedAt = new Date(match.created_at);
    if (playedAt < start || playedAt > end) continue;
    for (const participant of match.participants) {
      counts.set(
        participant.user_id,
        (counts.get(participant.user_id) ?? 0) + 1
      );
    }
  }

  return winnersFromCounts(counts);
}

export function computeGaboMoreti(matches: MatchRecord[]): string[] {
  const counts = new Map<string, number>();

  for (const match of matches) {
    const bagels = match.set_scores.filter((set) => set.p1 === 6 && set.p2 === 0).length;
    if (!bagels) continue;
    for (const winnerId of match.winner_ids) {
      counts.set(winnerId, (counts.get(winnerId) ?? 0) + bagels);
    }
  }

  return winnersFromCounts(counts);
}

export function computeElPadre(matches: MatchRecord[]): string[] {
  const winsVsOpponent = new Map<string, Map<string, number>>();

  for (const match of matches) {
    for (const winnerId of match.winner_ids) {
      for (const loserId of match.loser_ids) {
        const byOpponent = winsVsOpponent.get(winnerId) ?? new Map<string, number>();
        byOpponent.set(loserId, (byOpponent.get(loserId) ?? 0) + 1);
        winsVsOpponent.set(winnerId, byOpponent);
      }
    }
  }

  const bestDominance = new Map<string, number>();
  for (const [userId, byOpponent] of Array.from(winsVsOpponent.entries())) {
    const maxWins = Math.max(0, ...Array.from(byOpponent.values()));
    if (maxWins > 0) bestDominance.set(userId, maxWins);
  }

  return winnersFromCounts(bestDominance);
}

export function computeFedeGorrisen(matches: MatchRecord[]): string[] {
  const counts = new Map<string, number>();

  for (const match of matches) {
    if (new Date(match.created_at).getDay() !== 5) continue;
    for (const participant of match.participants) {
      counts.set(
        participant.user_id,
        (counts.get(participant.user_id) ?? 0) + 1
      );
    }
  }

  return winnersFromCounts(counts);
}

export function computeSorpresaSauna(matches: MatchRecord[]): string[] {
  let maxUpset = 0;
  const holders = new Set<string>();

  for (const match of matches) {
    const winners = match.participants.filter((p) => p.team === "winner");
    const losers = match.participants.filter((p) => p.team === "loser");

    for (const winner of winners) {
      for (const loser of losers) {
        const upset = loser.rating_before - winner.rating_before;
        if (upset <= 0) continue;
        if (upset > maxUpset) {
          maxUpset = upset;
          holders.clear();
          holders.add(winner.user_id);
        } else if (upset === maxUpset) {
          holders.add(winner.user_id);
        }
      }
    }
  }

  return Array.from(holders);
}

export const COMPETITIVE_BADGE_CODES = [
  "pequeno_charles",
  "gabo_moreti",
  "el_padre",
  "fede_gorrisen",
  "sorpresa_sauna",
] as const;

export type CompetitiveBadgeCode = (typeof COMPETITIVE_BADGE_CODES)[number];

export function computeCompetitiveBadgeHolders(
  matches: MatchRecord[],
  now = new Date()
): Record<CompetitiveBadgeCode, string[]> {
  return {
    pequeno_charles: computePequenoCharles(matches, now),
    gabo_moreti: computeGaboMoreti(matches),
    el_padre: computeElPadre(matches),
    fede_gorrisen: computeFedeGorrisen(matches),
    sorpresa_sauna: computeSorpresaSauna(matches),
  };
}
