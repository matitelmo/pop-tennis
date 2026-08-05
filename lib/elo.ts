import { FORMAT_MULTIPLIERS, K_FACTOR } from "@/lib/constants";
import type { MatchFormat, SetScore } from "@/types/database";

export type EloDeltaResult = {
  delta: number;
  multipliers: {
    format: number;
    sets: number;
    weekly: number;
  };
};

function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

export function expectedScore(selfRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - selfRating) / 400));
}

export function getFormatMultiplier(format: MatchFormat): number {
  return FORMAT_MULTIPLIERS[format];
}

export function getSetsMultiplier(format: MatchFormat, setScores: SetScore[]): number {
  const winnerSets = setScores.filter((s) => s.p1 > s.p2).length;
  const isBo5 = format.endsWith("bo5");
  const isWalkover = isBo5 ? winnerSets === 3 && setScores.length === 3 : winnerSets === 2 && setScores.length === 2;
  return isWalkover ? 1.2 : 1.0;
}

export function calculateEloDelta(params: {
  winnerRatings: number[];
  loserRatings: number[];
  format: MatchFormat;
  setScores: SetScore[];
  weeklyWinMultiplier?: number;
}): EloDeltaResult {
  const winnerAvg = averageRating(params.winnerRatings);
  const loserAvg = averageRating(params.loserRatings);
  const expected = expectedScore(winnerAvg, loserAvg);

  const formatMultiplier = getFormatMultiplier(params.format);
  const setsMultiplier = getSetsMultiplier(params.format, params.setScores);
  const weeklyMultiplier = params.weeklyWinMultiplier ?? 1;

  const delta =
    K_FACTOR *
    (1 - expected) *
    formatMultiplier *
    setsMultiplier *
    weeklyMultiplier;

  return {
    delta: Math.round(delta),
    multipliers: {
      format: formatMultiplier,
      sets: setsMultiplier,
      weekly: weeklyMultiplier,
    },
  };
}

export function determineWinnerFromSets(
  setScores: SetScore[],
  bestOf: 3 | 5
): { winnerSets: number; loserSets: number; isComplete: boolean } {
  const winnerSets = setScores.filter((s) => s.p1 > s.p2).length;
  const loserSets = setScores.filter((s) => s.p2 > s.p1).length;
  const setsToWin = bestOf === 5 ? 3 : 2;
  const isComplete = winnerSets === setsToWin || loserSets === setsToWin;
  return { winnerSets, loserSets, isComplete };
}

export function normalizeSetScoresForWinner(
  setScores: SetScore[],
  team1Won: boolean
): SetScore[] {
  if (team1Won) return setScores;
  return setScores.map((s) => ({ p1: s.p2, p2: s.p1 }));
}
