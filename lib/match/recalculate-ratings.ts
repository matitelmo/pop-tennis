import { computeMatchOutcome } from "@/lib/match/apply-match";
import { createServiceClient } from "@/lib/supabase/admin";
import type { MatchFormat, SetScore } from "@/types/database";

type ProfileRow = {
  id: string;
  base_rating: number;
  created_at: string;
};

type MatchRow = {
  id: string;
  status: string;
  format: MatchFormat;
  set_scores: SetScore[];
  team1_ids: string[];
  team2_ids: string[];
  winning_team: number;
  counter_set_scores: SetScore[] | null;
  counter_winning_team: number | null;
  is_weekly_match: boolean | null;
  created_at: string;
};

export type RecalculateResult = {
  matchesUpdated: number;
  participantsUpdated: number;
  profilesUpdated: number;
  details: {
    matchId: string;
    status: string;
    delta: number;
    ratingChanges: Record<string, number>;
  }[];
};

function getMatchInput(match: MatchRow) {
  const useCounter =
    match.status === "counter_proposed" &&
    match.counter_set_scores &&
    match.counter_winning_team;

  return {
    format: match.format,
    team1Ids: match.team1_ids,
    team2Ids: match.team2_ids,
    winningTeam: (useCounter ? match.counter_winning_team : match.winning_team) as 1 | 2,
    setScores: (useCounter ? match.counter_set_scores : match.set_scores) as SetScore[],
  };
}

export async function recalculateAllMatchRatings(): Promise<RecalculateResult> {
  const admin = createServiceClient();

  const [{ data: profiles }, { data: matches }] = await Promise.all([
    admin.from("profiles").select("id, base_rating, created_at"),
    admin
      .from("matches")
      .select(
        "id, status, format, set_scores, team1_ids, team2_ids, winning_team, counter_set_scores, counter_winning_team, is_weekly_match, created_at"
      )
      .in("status", ["confirmed", "pending", "counter_proposed"])
      .order("created_at", { ascending: true }),
  ]);

  const baseRatings = new Map(
    (profiles ?? []).map((profile: ProfileRow) => [profile.id, profile.base_rating])
  );
  const runningRatings = new Map(baseRatings);

  const details: RecalculateResult["details"] = [];
  let participantsUpdated = 0;

  for (const match of (matches ?? []) as MatchRow[]) {
    const input = getMatchInput(match);
    const participantIds = [...input.team1Ids, ...input.team2Ids];
    const ratingsMap: Record<string, number> = {};

    for (const id of participantIds) {
      const rating = runningRatings.get(id) ?? baseRatings.get(id);
      if (rating === undefined) {
        throw new Error(`Missing profile/rating for participant ${id} in match ${match.id}`);
      }
      ratingsMap[id] = rating;
    }

    const computed = await computeMatchOutcome(input, ratingsMap, {
      isWeeklyMatch: Boolean(match.is_weekly_match),
    });

    if (!computed.success) {
      throw new Error(`Match ${match.id}: ${computed.error}`);
    }

    const { outcome } = computed;
    const ratingChanges = outcome.ratingChanges;

    await admin
      .from("matches")
      .update({
        rating_changes: ratingChanges,
        winner_ids: outcome.winnerIds,
        loser_ids: outcome.loserIds,
        set_scores: outcome.normalizedScores,
      })
      .eq("id", match.id);

    if (match.status === "confirmed") {
      for (const id of participantIds) {
        const before = ratingsMap[id];
        const delta = ratingChanges[id] ?? 0;
        const after = before + delta;

        const { error } = await admin
          .from("match_participants")
          .update({
            team: outcome.winnerIds.includes(id) ? "winner" : "loser",
            rating_before: before,
            rating_after: after,
            rating_delta: delta,
          })
          .eq("match_id", match.id)
          .eq("user_id", id);

        if (error) {
          throw new Error(`Failed to update participant ${id} for match ${match.id}: ${error.message}`);
        }
        participantsUpdated++;
      }
    }

    for (const [id, delta] of Object.entries(ratingChanges)) {
      runningRatings.set(id, (runningRatings.get(id) ?? baseRatings.get(id) ?? 0) + delta);
    }

    details.push({
      matchId: match.id,
      status: match.status,
      delta: outcome.delta,
      ratingChanges,
    });
  }

  let profilesUpdated = 0;
  for (const [id, rating] of Array.from(runningRatings.entries())) {
    const { error } = await admin.from("profiles").update({ rating }).eq("id", id);
    if (error) {
      throw new Error(`Failed to update profile ${id}: ${error.message}`);
    }
    profilesUpdated++;
  }

  return {
    matchesUpdated: details.length,
    participantsUpdated,
    profilesUpdated,
    details,
  };
}
