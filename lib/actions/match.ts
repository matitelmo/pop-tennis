"use server";

import { revalidatePath } from "next/cache";
import {
  applyConfirmedMatch,
  computeMatchOutcome,
  fetchRatingsForIds,
  getConfirmationDeadline,
  getOpponentTeamIds,
  type MatchInput,
} from "@/lib/match/apply-match";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { MatchFormat, SetScore } from "@/types/database";
import type { MatchPointSummary } from "@/lib/match-labels";

export type SubmitMatchInput = MatchInput;

export type SubmitMatchResult = {
  success: boolean;
  error?: string;
  deltas?: Record<string, number>;
  matchId?: string;
  pendingConfirmation?: boolean;
  multipliers?: { format: number; sets: number };
  summary?: MatchPointSummary;
};

export type PendingMatch = {
  id: string;
  format: MatchFormat;
  set_scores: SetScore[];
  winner_ids: string[];
  loser_ids: string[];
  team1_ids: string[];
  team2_ids: string[];
  winning_team: number;
  status: string;
  submitted_by: string;
  confirmation_deadline: string;
  counter_set_scores: SetScore[] | null;
  counter_winning_team: number | null;
  rating_changes: Record<string, number> | null;
  created_at: string;
  submitter_name?: string;
  role: "needs_confirm" | "waiting" | "needs_accept_counter";
};

export async function previewMatchDelta(
  input: SubmitMatchInput
): Promise<SubmitMatchResult> {
  const allIds = [...input.team1Ids, ...input.team2Ids];
  const ratingsMap = await fetchRatingsForIds(allIds);
  const computed = await computeMatchOutcome(input, ratingsMap);

  if (!computed.success) {
    return { success: false, error: computed.error };
  }

  return {
    success: true,
    deltas: computed.outcome.ratingChanges,
    multipliers: computed.outcome.multipliers,
    summary: computed.outcome.summary,
  };
}

export async function submitMatch(input: SubmitMatchInput): Promise<SubmitMatchResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const allIds = [...input.team1Ids, ...input.team2Ids];
  if (!allIds.includes(user.id)) {
    return { success: false, error: "Tenés que ser participante del partido" };
  }

  const ratingsMap = await fetchRatingsForIds(allIds);
  const computed = await computeMatchOutcome(input, ratingsMap);

  if (!computed.success) {
    return { success: false, error: computed.error };
  }

  const { outcome } = computed;
  const admin = createServiceClient();
  const deadline = getConfirmationDeadline();

  const { data: match, error: matchError } = await admin
    .from("matches")
    .insert({
      format: input.format,
      set_scores: input.setScores,
      winner_ids: outcome.winnerIds,
      loser_ids: outcome.loserIds,
      rating_changes: outcome.ratingChanges,
      status: "pending",
      submitted_by: user.id,
      confirmation_deadline: deadline,
      team1_ids: input.team1Ids,
      team2_ids: input.team2Ids,
      winning_team: input.winningTeam,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return { success: false, error: matchError?.message ?? "Error al guardar partido" };
  }

  revalidatePath("/ranking");
  revalidatePath("/historial");
  revalidatePath("/partido");

  return {
    success: true,
    deltas: outcome.ratingChanges,
    matchId: match.id,
    pendingConfirmation: true,
    multipliers: outcome.multipliers,
    summary: outcome.summary,
  };
}

export async function confirmMatch(matchId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (!match || match.status !== "pending") {
    return { success: false, error: "Partido no encontrado o ya confirmado" };
  }

  const team1Ids = match.team1_ids as string[];
  const team2Ids = match.team2_ids as string[];
  const opponents = getOpponentTeamIds(match.submitted_by, team1Ids, team2Ids);

  if (!opponents.includes(user.id)) {
    return { success: false, error: "Solo un rival puede confirmar este resultado" };
  }

  await admin
    .from("matches")
    .update({ confirmed_by: user.id })
    .eq("id", matchId);

  const result = await applyConfirmedMatch(matchId, user.id);

  if (result.success) {
    revalidatePath("/ranking");
    revalidatePath("/historial");
    revalidatePath("/partido");
    revalidatePath("/perfil");
  }

  return result;
}

export async function proposeCounterMatch(
  matchId: string,
  input: { setScores: SetScore[]; winningTeam: 1 | 2 }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (!match || match.status !== "pending") {
    return { success: false, error: "Partido no disponible para disputa" };
  }

  const team1Ids = match.team1_ids as string[];
  const team2Ids = match.team2_ids as string[];
  const opponents = getOpponentTeamIds(match.submitted_by, team1Ids, team2Ids);

  if (!opponents.includes(user.id)) {
    return { success: false, error: "Solo un rival puede proponer otro resultado" };
  }

  const ratingsMap = await fetchRatingsForIds([...team1Ids, ...team2Ids]);
  const computed = await computeMatchOutcome(
    {
      format: match.format as MatchFormat,
      team1Ids,
      team2Ids,
      winningTeam: input.winningTeam,
      setScores: input.setScores,
    },
    ratingsMap
  );

  if (!computed.success) {
    return { success: false, error: computed.error };
  }

  await admin
    .from("matches")
    .update({
      status: "counter_proposed",
      counter_set_scores: input.setScores,
      counter_winning_team: input.winningTeam,
      counter_submitted_by: user.id,
      confirmation_deadline: getConfirmationDeadline(),
      rating_changes: computed.outcome.ratingChanges,
      winner_ids: computed.outcome.winnerIds,
      loser_ids: computed.outcome.loserIds,
    })
    .eq("id", matchId);

  revalidatePath("/ranking");
  revalidatePath("/partido");

  return { success: true };
}

export async function acceptCounterMatch(
  matchId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (!match || match.status !== "counter_proposed") {
    return { success: false, error: "No hay contrapropuesta pendiente" };
  }

  if (match.submitted_by !== user.id) {
    return { success: false, error: "Solo quien cargó el partido puede aceptar la contrapropuesta" };
  }

  const result = await applyConfirmedMatch(matchId, match.counter_submitted_by ?? user.id);

  if (result.success) {
    revalidatePath("/ranking");
    revalidatePath("/historial");
    revalidatePath("/partido");
    revalidatePath("/perfil");
  }

  return result;
}

export async function getPendingMatchesForUser(userId: string): Promise<PendingMatch[]> {
  const admin = createServiceClient();

  const { data: matches } = await admin
    .from("matches")
    .select("*")
    .in("status", ["pending", "counter_proposed"])
    .order("created_at", { ascending: false });

  if (!matches?.length) return [];

  const submitterIds = Array.from(
    new Set(matches.map((m) => m.submitted_by).filter(Boolean))
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", submitterIds);

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return matches
    .filter((m) => {
      const team1 = m.team1_ids as string[];
      const team2 = m.team2_ids as string[];
      const all = [...team1, ...team2];
      return all.includes(userId);
    })
    .map((m) => {
      const team1 = m.team1_ids as string[];
      const team2 = m.team2_ids as string[];
      const opponents = getOpponentTeamIds(m.submitted_by, team1, team2);

      let role: PendingMatch["role"] = "waiting";
      if (m.status === "counter_proposed" && m.submitted_by === userId) {
        role = "needs_accept_counter";
      } else if (m.status === "pending" && opponents.includes(userId)) {
        role = "needs_confirm";
      }

      return {
        id: m.id,
        format: m.format as MatchFormat,
        set_scores: m.set_scores as SetScore[],
        winner_ids: m.winner_ids as string[],
        loser_ids: m.loser_ids as string[],
        team1_ids: team1,
        team2_ids: team2,
        winning_team: m.winning_team,
        status: m.status,
        submitted_by: m.submitted_by,
        confirmation_deadline: m.confirmation_deadline,
        counter_set_scores: m.counter_set_scores as SetScore[] | null,
        counter_winning_team: m.counter_winning_team,
        rating_changes: m.rating_changes as Record<string, number> | null,
        created_at: m.created_at,
        submitter_name: nameMap[m.submitted_by] ?? "Jugador",
        role,
      };
    })
    .filter((m) => m.role !== "waiting" || m.submitted_by === userId);
}

export async function getAllProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return data ?? [];
}
