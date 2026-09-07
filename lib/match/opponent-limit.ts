import { getSubmitterTeam } from "@/lib/match/apply-match";

export type OpponentLimitSettings = {
  limit: number;
  windowDays: number;
};

export function normalizeTeamKey(ids: string[]): string {
  return [...ids].sort().join(",");
}

/** Canonical key for a match — same two sides regardless of team1/team2 order. */
export function getMatchupKey(team1Ids: string[], team2Ids: string[]): string {
  const sides = [normalizeTeamKey(team1Ids), normalizeTeamKey(team2Ids)].sort();
  return `${sides[0]}|${sides[1]}`;
}

export function userInMatch(userId: string, team1Ids: string[], team2Ids: string[]): boolean {
  return [...team1Ids, ...team2Ids].includes(userId);
}

export function isSameDoublesMatchup(
  team1Ids: string[],
  team2Ids: string[],
  histTeam1Ids: string[],
  histTeam2Ids: string[]
): boolean {
  return getMatchupKey(team1Ids, team2Ids) === getMatchupKey(histTeam1Ids, histTeam2Ids);
}

export function isSameSinglesOpponent(
  userId: string,
  team1Ids: string[],
  team2Ids: string[],
  histTeam1Ids: string[],
  histTeam2Ids: string[]
): boolean {
  const team = getSubmitterTeam(userId, team1Ids, team2Ids);
  if (!team) return false;

  const myTeam = team === 1 ? team1Ids : team2Ids;
  const oppTeam = team === 1 ? team2Ids : team1Ids;
  if (myTeam.length !== 1 || oppTeam.length !== 1) return false;

  const opponentId = oppTeam[0];
  const histTeam = getSubmitterTeam(userId, histTeam1Ids, histTeam2Ids);
  if (!histTeam) return false;

  const histMy = histTeam === 1 ? histTeam1Ids : histTeam2Ids;
  const histOpp = histTeam === 1 ? histTeam2Ids : histTeam1Ids;
  if (histMy.length !== 1 || histOpp.length !== 1) return false;

  return histOpp[0] === opponentId;
}

export type RecentMatchRow = {
  team1_ids: string[];
  team2_ids: string[];
};

export function countRecentMatchingMatchups(
  userId: string,
  team1Ids: string[],
  team2Ids: string[],
  recentMatches: RecentMatchRow[],
  isDoubles: boolean
): number {
  let count = 0;
  for (const m of recentMatches) {
    const histTeam1 = m.team1_ids;
    const histTeam2 = m.team2_ids;
    if (!userInMatch(userId, histTeam1, histTeam2)) continue;

    const matches = isDoubles
      ? isSameDoublesMatchup(team1Ids, team2Ids, histTeam1, histTeam2)
      : isSameSinglesOpponent(userId, team1Ids, team2Ids, histTeam1, histTeam2);

    if (matches) count++;
  }
  return count;
}

export function opponentLimitError(limit: number, windowDays: number): string {
  if (limit === 1) {
    return `Ya jugaste un partido con este rival en los últimos ${windowDays} días`;
  }
  return `Ya jugaste ${limit} partidos contra este rival en los últimos ${windowDays} días`;
}

export function checkOpponentMatchLimit(params: {
  settings: OpponentLimitSettings;
  userId: string;
  team1Ids: string[];
  team2Ids: string[];
  format: string;
  recentMatches: RecentMatchRow[];
}): { ok: true } | { ok: false; error: string } {
  const { settings, userId, team1Ids, team2Ids, format, recentMatches } = params;
  if (settings.limit <= 0) return { ok: true };

  const isDoubles = format.startsWith("2v2_");
  const count = countRecentMatchingMatchups(
    userId,
    team1Ids,
    team2Ids,
    recentMatches,
    isDoubles
  );

  if (count >= settings.limit) {
    return { ok: false, error: opponentLimitError(settings.limit, settings.windowDays) };
  }

  return { ok: true };
}
