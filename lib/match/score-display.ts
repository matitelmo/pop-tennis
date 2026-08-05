import type { SetScore } from "@/types/database";

export function formatTeamName(
  ids: string[],
  profileNames: Record<string, string>
): string {
  return ids.map((id) => profileNames[id] ?? "?").join(" & ");
}

export function formatSetScoresLine(setScores: SetScore[]): string {
  return setScores.map((s) => `${s.p1}-${s.p2}`).join(" · ");
}

export function formatSetScoresWithTeams(
  setScores: SetScore[],
  team1Name: string,
  team2Name: string
): string {
  return setScores
    .map((s) => `${team1Name} ${s.p1}-${s.p2} ${team2Name}`)
    .join(" · ");
}
