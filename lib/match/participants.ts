import type { Match } from "@/types/database";

export function getOpponentIds(match: Match, userId: string): string[] {
  const team1 = (match.team1_ids ?? []) as string[];
  const team2 = (match.team2_ids ?? []) as string[];
  const inTeam1 = team1.includes(userId);
  const myTeam = inTeam1 ? team1 : team2;
  const oppTeam = inTeam1 ? team2 : team1;
  const fromIds = [...(match.winner_ids as string[]), ...(match.loser_ids as string[])].filter(
    (id) => !myTeam.includes(id)
  );
  return fromIds.length ? fromIds : oppTeam;
}

export function getTeammateIds(match: Match, userId: string): string[] {
  const team1 = (match.team1_ids ?? []) as string[];
  const team2 = (match.team2_ids ?? []) as string[];
  const myTeam = team1.includes(userId) ? team1 : team2.includes(userId) ? team2 : [];
  return myTeam.filter((id) => id !== userId);
}

export function pairingKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
