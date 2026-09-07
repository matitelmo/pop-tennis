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
import { isWeeklyMatchOpponent } from "@/lib/actions/weekly-match";
import { getCurrentUserProfile, getUserEmail } from "@/lib/actions/auth";
import { assertAdmin } from "@/lib/admin/auth";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { parseCommunitySettings } from "@/lib/community/settings";
import { rosterToPickableProfile } from "@/lib/community/roster-as-players";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasActiveSubscription } from "@/lib/subscription";
import { allowsFormat } from "@/lib/community/settings";
import {
  sendDisputeToAdmin,
  sendMatchConfirmRequest,
} from "@/lib/email/send";
import type { MatchFormat, SetScore, Profile, CommunityMember } from "@/types/database";
import type { MatchPointSummary } from "@/lib/match-labels";
import { formatSetScoresWithTeams, formatTeamName } from "@/lib/match/score-display";

export type SubmitMatchInput = MatchInput & { communitySlug: string };

export type SubmitMatchResult = {
  success: boolean;
  error?: string;
  deltas?: Record<string, number>;
  matchId?: string;
  pendingConfirmation?: boolean;
  multipliers?: { format: number; sets: number; weekly: number };
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

export type MatchRevealData = {
  deltas: Record<string, number>;
  names: Record<string, string>;
  winnerIds: string[];
  loserIds: string[];
  scoreStr: string;
  setScores?: SetScore[];
  team1Ids?: string[];
  team2Ids?: string[];
  winningTeam?: 1 | 2;
};

const OPPONENT_LIMIT = 2;
const OPPONENT_WINDOW_DAYS = 30;

async function buildMatchReveal(matchId: string): Promise<MatchRevealData | null> {
  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();
  if (!match || !match.rating_changes) return null;

  const winnerIds = match.winner_ids as string[];
  const loserIds = match.loser_ids as string[];
  const team1Ids = match.team1_ids as string[];
  const team2Ids = match.team2_ids as string[];
  const setScores = match.set_scores as SetScore[];
  const winningTeam = match.winning_team as 1 | 2;
  const allIds = Array.from(new Set([...winnerIds, ...loserIds, ...team1Ids, ...team2Ids]));
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", allIds);
  const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const team1Name = formatTeamName(team1Ids, names);
  const team2Name = formatTeamName(team2Ids, names);
  const scoreStr = formatSetScoresWithTeams(setScores, team1Name, team2Name);

  return {
    deltas: match.rating_changes as Record<string, number>,
    names,
    winnerIds,
    loserIds,
    scoreStr,
    setScores,
    team1Ids,
    team2Ids,
    winningTeam,
  };
}

async function countRecentOpponentMatches(
  communityId: string,
  userId: string,
  opponentIds: string[]
): Promise<number> {
  if (!opponentIds.length) return 0;
  const admin = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - OPPONENT_WINDOW_DAYS);

  const { data: matches } = await admin
    .from("matches")
    .select("team1_ids, team2_ids, status")
    .eq("community_id", communityId)
    .in("status", ["pending", "counter_proposed", "confirmed"])
    .gte("created_at", since.toISOString());

  let count = 0;
  for (const m of matches ?? []) {
    const team1 = m.team1_ids as string[];
    const team2 = m.team2_ids as string[];
    const all = [...team1, ...team2];
    if (!all.includes(userId)) continue;
    const opponents = getOpponentTeamIds(userId, team1, team2);
    if (opponentIds.some((oid) => opponents.includes(oid))) count++;
  }
  return count;
}

async function notifyOpponentsToConfirm(params: {
  matchId: string;
  submitterId: string;
  team1Ids: string[];
  team2Ids: string[];
  setScores: SetScore[];
  submitterName: string;
  communitySlug: string;
}) {
  const opponents = getOpponentTeamIds(
    params.submitterId,
    params.team1Ids,
    params.team2Ids
  );
  const admin = createServiceClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...params.team1Ids, ...params.team2Ids]);
  const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const team1Name = formatTeamName(params.team1Ids, names);
  const team2Name = formatTeamName(params.team2Ids, names);
  const scoreSummary = formatSetScoresWithTeams(params.setScores, team1Name, team2Name);

  for (const opponentId of opponents) {
    const email = await getUserEmail(opponentId);
    if (!email) continue;
    await sendMatchConfirmRequest({
      toEmail: email,
      toName: names[opponentId] ?? "Jugador",
      submitterName: params.submitterName,
      scoreSummary,
      communitySlug: params.communitySlug,
    });
  }
}

export async function previewMatchDelta(
  input: SubmitMatchInput
): Promise<SubmitMatchResult> {
  const community = await getCommunityBySlug(input.communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allIds = [...input.team1Ids, ...input.team2Ids];
  const ratingsMap = await fetchRatingsForIds(community.id, allIds);

  let isWeeklyMatch = false;
  if (user && allIds.includes(user.id)) {
    const opponentIds = getOpponentTeamIds(user.id, input.team1Ids, input.team2Ids);
    isWeeklyMatch =
      input.format.startsWith("1v1_") &&
      (await isWeeklyMatchOpponent(community.id, user.id, opponentIds));
  }

  const computed = await computeMatchOutcome(input, ratingsMap, { isWeeklyMatch });

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
  const community = await getCommunityBySlug(input.communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const member = await getCommunityMember(community.id, user.id);
  if (!member) return { success: false, error: "No sos miembro de esta comunidad" };

  if (community.settings.requires_subscription && !hasActiveSubscription(member)) {
    return {
      success: false,
      error: "Necesitás una suscripción activa para cargar partidos",
    };
  }

  if (!allowsFormat(community.settings, input.format)) {
    return { success: false, error: "Formato no permitido en esta comunidad" };
  }

  const allIds = [...input.team1Ids, ...input.team2Ids];
  const ratingsMap = await fetchRatingsForIds(community.id, allIds);

  const isParticipant = allIds.includes(user.id);
  const opponentIds = isParticipant
    ? getOpponentTeamIds(user.id, input.team1Ids, input.team2Ids)
    : [];

  if (isParticipant && opponentIds.length) {
    const recentCount = await countRecentOpponentMatches(community.id, user.id, opponentIds);
    if (recentCount >= OPPONENT_LIMIT) {
      return {
        success: false,
        error: `Ya jugaste ${OPPONENT_LIMIT} partidos contra este rival en los últimos 30 días`,
      };
    }
  }

  const isWeeklyMatch =
    isParticipant &&
    input.format.startsWith("1v1_") &&
    (await isWeeklyMatchOpponent(community.id, user.id, opponentIds));

  const computed = await computeMatchOutcome(input, ratingsMap, { isWeeklyMatch });

  if (!computed.success) {
    return { success: false, error: computed.error };
  }

  const { outcome } = computed;
  const admin = createServiceClient();
  const isInstant = community.settings.match_confirmation === "instant";

  const { data: match, error: matchError } = await admin
    .from("matches")
    .insert({
      format: input.format,
      set_scores: input.setScores,
      winner_ids: outcome.winnerIds,
      loser_ids: outcome.loserIds,
      rating_changes: outcome.ratingChanges,
      status: isInstant ? "confirmed" : "pending",
      submitted_by: user.id,
      confirmation_deadline: isInstant ? null : getConfirmationDeadline(),
      team1_ids: input.team1Ids,
      team2_ids: input.team2Ids,
      winning_team: input.winningTeam,
      is_weekly_match: isWeeklyMatch,
      community_id: community.id,
      confirmed_by: isInstant ? user.id : null,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return { success: false, error: matchError?.message ?? "Error al guardar partido" };
  }

  if (isInstant) {
    await applyConfirmedMatch(match.id, user.id);
  } else {
    const profile = await getCurrentUserProfile();
    await notifyOpponentsToConfirm({
      matchId: match.id,
      submitterId: user.id,
      team1Ids: input.team1Ids,
      team2Ids: input.team2Ids,
      setScores: input.setScores,
      submitterName: profile?.full_name ?? "Jugador",
      communitySlug: input.communitySlug,
    });
  }

  revalidateCommunityPaths(input.communitySlug);

  return {
    success: true,
    deltas: outcome.ratingChanges,
    matchId: match.id,
    pendingConfirmation: !isInstant,
    multipliers: outcome.multipliers,
    summary: outcome.summary,
  };
}

export async function confirmMatch(
  communitySlug: string,
  matchId: string
): Promise<{ success: boolean; error?: string; reveal?: MatchRevealData }> {
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

  await admin.from("matches").update({ confirmed_by: user.id }).eq("id", matchId);

  const result = await applyConfirmedMatch(matchId, user.id);

  if (result.success) {
    revalidateCommunityPaths(communitySlug);
    const reveal = await buildMatchReveal(matchId);
    return { success: true, reveal: reveal ?? undefined };
  }

  return result;
}

export async function disputeMatch(
  communitySlug: string,
  matchId: string
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
    return { success: false, error: "Solo un rival puede disputar este resultado" };
  }

  await admin
    .from("matches")
    .update({ status: "disputed", counter_submitted_by: user.id })
    .eq("id", matchId);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [match.submitted_by, user.id]);
  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendDisputeToAdmin({
      adminEmail,
      matchId,
      submitterName: nameMap[match.submitted_by] ?? "?",
      disputerName: nameMap[user.id] ?? "?",
    });
  }

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}

export async function proposeCounterMatch(
  communitySlug: string,
  matchId: string,
  input: { setScores: SetScore[]; winningTeam: 1 | 2 }
): Promise<{ success: boolean; error?: string }> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

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

  const ratingsMap = await fetchRatingsForIds(community.id, [...team1Ids, ...team2Ids]);
  const computed = await computeMatchOutcome(
    {
      format: match.format as MatchFormat,
      team1Ids,
      team2Ids,
      winningTeam: input.winningTeam,
      setScores: input.setScores,
    },
    ratingsMap,
    { isWeeklyMatch: Boolean(match.is_weekly_match) }
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

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}

export async function acceptCounterMatch(
  communitySlug: string,
  matchId: string
): Promise<{ success: boolean; error?: string; reveal?: MatchRevealData }> {
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
    revalidateCommunityPaths(communitySlug);
    const reveal = await buildMatchReveal(matchId);
    return { success: true, reveal: reveal ?? undefined };
  }

  return result;
}

export async function adminResolveMatch(
  communitySlug: string,
  matchId: string,
  action: "confirm" | "delete"
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const { profile } = auth;

  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (!match || match.status !== "disputed") {
    return { success: false, error: "Partido no encontrado o no está en disputa" };
  }

  if (action === "delete") {
    await admin.from("matches").delete().eq("id", matchId);
  } else {
    const result = await applyConfirmedMatch(matchId, profile.id);
    if (!result.success) return result;
  }

  revalidateCommunityPaths(communitySlug);
  revalidatePath("/admin/disputes");
  return { success: true };
}

export async function getPendingMatchesForUser(
  communityId: string,
  userId: string
): Promise<PendingMatch[]> {
  const admin = createServiceClient();

  const { data: matches } = await admin
    .from("matches")
    .select("*")
    .eq("community_id", communityId)
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

export async function getCommunityProfiles(
  communityId: string
): Promise<(Profile & { member?: CommunityMember; isRosterOnly?: boolean })[]> {
  const admin = createServiceClient();
  const { data: communityRow } = await admin
    .from("communities")
    .select("settings")
    .eq("id", communityId)
    .maybeSingle();

  const settings = parseCommunitySettings(communityRow?.settings);

  const { data } = await admin
    .from("community_members")
    .select("*, profile:profiles(*)")
    .eq("community_id", communityId);

  const memberProfiles = (data ?? []).map((row) => {
    const { profile, ...member } = row as CommunityMember & { profile: Profile };
    return { ...profile, member };
  });

  if (settings.signup_mode !== "roster") {
    return memberProfiles;
  }

  const { data: rosterRows } = await admin
    .from("roster_players")
    .select("*")
    .eq("community_id", communityId)
    .is("claimed_by", null);

  const rosterProfiles = (rosterRows ?? []).map(rosterToPickableProfile);
  return [...memberProfiles, ...rosterProfiles];
}

export async function getCommunityProfilesBySlug(slug: string) {
  const community = await getCommunityBySlug(slug);
  if (!community) return [];
  return getCommunityProfiles(community.id);
}

export async function getDisputedMatches(communityId?: string) {
  const auth = await assertAdmin();
  if (!auth.success) return [];

  const admin = createServiceClient();
  let query = admin
    .from("matches")
    .select("*")
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  if (communityId) {
    query = query.eq("community_id", communityId);
  }

  const { data } = await query;
  return data ?? [];
}
