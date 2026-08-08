import { checkAndAwardBadges } from "@/lib/badges";
import { CONFIRMATION_HOURS, WEEKLY_MATCH_WIN_MULTIPLIER } from "@/lib/constants";
import {
  calculateEloDelta,
  determineWinnerFromSets,
  normalizeSetScoresForWinner,
} from "@/lib/elo";
import { validateMatchScores } from "@/lib/match/set-scores";
import { buildMatchPointSummary, type MatchPointSummary } from "@/lib/match-labels";
import { createServiceClient } from "@/lib/supabase/admin";
import type { MatchFormat, SetScore } from "@/types/database";

export type MatchInput = {
  format: MatchFormat;
  team1Ids: string[];
  team2Ids: string[];
  winningTeam: 1 | 2;
  setScores: SetScore[];
};

export type MatchOutcome = {
  winnerIds: string[];
  loserIds: string[];
  normalizedScores: SetScore[];
  ratingChanges: Record<string, number>;
  delta: number;
  multipliers: { format: number; sets: number; weekly: number };
  summary: MatchPointSummary;
  isWeeklyMatch: boolean;
};

export function getConfirmationDeadline(): string {
  const d = new Date();
  d.setHours(d.getHours() + CONFIRMATION_HOURS);
  return d.toISOString();
}

export async function applyRatingChanges(
  changes: Record<string, number>,
  options?: { updateLastMatchAt?: boolean }
): Promise<void> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  for (const [id, delta] of Object.entries(changes)) {
    const { data: profile } = await admin
      .from("profiles")
      .select("rating")
      .eq("id", id)
      .single();

    if (!profile) continue;

    const update: { rating: number; last_match_at?: string } = {
      rating: profile.rating + delta,
    };
    if (options?.updateLastMatchAt) {
      update.last_match_at = now;
    }

    await admin.from("profiles").update(update).eq("id", id);
  }
}

export async function rollbackRatingChanges(changes: Record<string, number>): Promise<void> {
  const admin = createServiceClient();

  for (const [id, delta] of Object.entries(changes)) {
    const { data: profile } = await admin
      .from("profiles")
      .select("rating")
      .eq("id", id)
      .single();

    if (!profile) continue;

    await admin
      .from("profiles")
      .update({ rating: profile.rating - delta })
      .eq("id", id);
  }
}

export function getSubmitterTeam(
  submitterId: string,
  team1Ids: string[],
  team2Ids: string[]
): 1 | 2 | null {
  if (team1Ids.includes(submitterId)) return 1;
  if (team2Ids.includes(submitterId)) return 2;
  return null;
}

export function getOpponentTeamIds(
  submitterId: string,
  team1Ids: string[],
  team2Ids: string[]
): string[] {
  const team = getSubmitterTeam(submitterId, team1Ids, team2Ids);
  if (team === 1) return team2Ids;
  if (team === 2) return team1Ids;
  return [...team1Ids, ...team2Ids];
}

export async function computeMatchOutcome(
  input: MatchInput,
  ratingsMap: Record<string, number>,
  options?: { isWeeklyMatch?: boolean }
): Promise<{ success: true; outcome: MatchOutcome } | { success: false; error: string }> {
  const bestOf = input.format.endsWith("bo5") ? 5 : 3;

  const scoreError = validateMatchScores(input.setScores, bestOf as 3 | 5, input.winningTeam);
  if (scoreError) {
    return { success: false, error: scoreError };
  }

  const { isComplete } = determineWinnerFromSets(input.setScores, bestOf as 3 | 5);

  if (!isComplete) {
    return { success: false, error: "El partido no tiene un ganador definido según el formato" };
  }

  const team1Won = input.winningTeam === 1;
  const winnerIds = team1Won ? input.team1Ids : input.team2Ids;
  const loserIds = team1Won ? input.team2Ids : input.team1Ids;

  const winnerRatings = winnerIds.map((id) => ratingsMap[id]);
  const loserRatings = loserIds.map((id) => ratingsMap[id]);

  if (winnerRatings.some((r) => r === undefined) || loserRatings.some((r) => r === undefined)) {
    return { success: false, error: "No se encontraron ratings de todos los jugadores" };
  }

  const normalizedScores = normalizeSetScoresForWinner(input.setScores, team1Won);
  const isWeeklyMatch = options?.isWeeklyMatch ?? false;
  const { delta, multipliers } = calculateEloDelta({
    winnerRatings,
    loserRatings,
    format: input.format,
    setScores: normalizedScores,
    weeklyWinMultiplier: isWeeklyMatch ? WEEKLY_MATCH_WIN_MULTIPLIER : undefined,
  });

  const ratingChanges: Record<string, number> = {};
  for (const id of winnerIds) ratingChanges[id] = delta;
  for (const id of loserIds) ratingChanges[id] = -delta;

  const summary = buildMatchPointSummary({
    winnerRatings,
    loserRatings,
    format: input.format,
    multipliers,
  });

  return {
    success: true,
    outcome: {
      winnerIds,
      loserIds,
      normalizedScores,
      ratingChanges,
      delta,
      multipliers,
      summary,
      isWeeklyMatch,
    },
  };
}

export async function fetchRatingsForIds(ids: string[]): Promise<Record<string, number>> {
  const admin = createServiceClient();
  const { data: profiles } = await admin.from("profiles").select("id, rating").in("id", ids);
  return Object.fromEntries((profiles ?? []).map((p) => [p.id, p.rating]));
}

export async function applyConfirmedMatch(
  matchId: string,
  confirmedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createServiceClient();

  const { data: match, error } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (error || !match) {
    return { success: false, error: "Partido no encontrado" };
  }

  if (match.status === "confirmed") {
    return { success: true };
  }

  const team1Ids = (match.team1_ids ?? []) as string[];
  const team2Ids = (match.team2_ids ?? []) as string[];
  const allIds = [...team1Ids, ...team2Ids];

  let setScores: SetScore[];
  let winningTeam: 1 | 2;

  if (match.status === "counter_proposed" && match.counter_set_scores) {
    setScores = match.counter_set_scores as SetScore[];
    winningTeam = match.counter_winning_team as 1 | 2;
  } else {
    setScores = match.set_scores as SetScore[];
    winningTeam = match.winning_team as 1 | 2;
  }

  const team1Won = winningTeam === 1;
  const normalizedScores = normalizeSetScoresForWinner(setScores, team1Won);
  const winnerIds = (match.winner_ids ?? []) as string[];
  const loserIds = (match.loser_ids ?? []) as string[];
  const ratingChanges = (match.rating_changes ?? {}) as Record<string, number>;

  const { data: existingParticipants } = await admin
    .from("match_participants")
    .select("user_id")
    .eq("match_id", matchId)
    .limit(1);

  if (!existingParticipants?.length) {
    const ratingsMap = await fetchRatingsForIds(allIds);
    const participantRows = allIds.map((id) => {
      const after = ratingsMap[id];
      const delta = ratingChanges[id] ?? 0;
      return {
        match_id: matchId,
        user_id: id,
        team: winnerIds.includes(id) ? ("winner" as const) : ("loser" as const),
        rating_before: after - delta,
        rating_after: after,
        rating_delta: delta,
      };
    });

    await admin.from("match_participants").insert(participantRows);
  }

  await admin
    .from("matches")
    .update({
      status: "confirmed",
      confirmed_by: confirmedBy ?? match.confirmed_by ?? match.submitted_by,
      set_scores: normalizedScores,
      winner_ids: winnerIds,
      loser_ids: loserIds,
      rating_changes: ratingChanges,
      confirmation_deadline: null,
    })
    .eq("id", matchId);

  await checkAndAwardBadges();

  return { success: true };
}

export async function autoConfirmExpiredMatches(): Promise<number> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("matches")
    .select("id")
    .in("status", ["pending", "counter_proposed"])
    .lte("confirmation_deadline", now);

  let count = 0;
  for (const m of expired ?? []) {
    const result = await applyConfirmedMatch(m.id);
    if (result.success) count++;
  }
  return count;
}
