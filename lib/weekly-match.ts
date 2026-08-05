import {
  WEEKLY_MATCH_COOLDOWN_WEEKS,
  WEEKLY_MATCH_RANK_WINDOW,
} from "@/lib/constants";
import { pairingKey } from "@/lib/match/participants";

export type RankedPlayer = {
  id: string;
  rating: number;
  rank: number;
};

export function buildRankedPlayers(
  profiles: { id: string; rating: number }[]
): RankedPlayer[] {
  return [...profiles]
    .sort((a, b) => b.rating - a.rating)
    .map((p, index) => ({
      id: p.id,
      rating: p.rating,
      rank: index + 1,
    }));
}

export function isWithinRankWindow(
  rankA: number,
  rankB: number,
  window = WEEKLY_MATCH_RANK_WINDOW
): boolean {
  return Math.abs(rankA - rankB) <= window;
}

export function isOnCooldown(
  userId: string,
  opponentId: string,
  cooldownPairs: Set<string>
): boolean {
  return cooldownPairs.has(pairingKey(userId, opponentId));
}

export function computeWeeklyPairings(
  players: RankedPlayer[],
  cooldownPairs: Set<string>,
  rankWindow = WEEKLY_MATCH_RANK_WINDOW
): Map<string, string> {
  const pairings = new Map<string, string>();
  const paired = new Set<string>();

  for (const player of players) {
    if (paired.has(player.id)) continue;

    const candidates = players
      .filter(
        (other) =>
          other.id !== player.id &&
          !paired.has(other.id) &&
          isWithinRankWindow(player.rank, other.rank, rankWindow) &&
          !isOnCooldown(player.id, other.id, cooldownPairs)
      )
      .sort(
        (a, b) =>
          Math.abs(a.rank - player.rank) - Math.abs(b.rank - player.rank) ||
          a.rank - b.rank
      );

    const match = candidates[0];
    if (!match) continue;

    pairings.set(player.id, match.id);
    pairings.set(match.id, player.id);
    paired.add(player.id);
    paired.add(match.id);
  }

  return pairings;
}

export function getWeekStartDateString(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function getCooldownWeekStarts(
  fromDate = new Date(),
  weeks = WEEKLY_MATCH_COOLDOWN_WEEKS
): string[] {
  const starts: string[] = [];
  for (let i = 1; i <= weeks; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() - i * 7);
    starts.push(getWeekStartDateString(d));
  }
  return starts;
}
