"use server";

import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";
import { getOpponentIds } from "@/lib/match/participants";
import { formatTeamName } from "@/lib/match/score-display";

export type HistoryItem = {
  rating_delta: number | null;
  team: "winner" | "loser" | null;
  match: Match;
  opponentNames: string[];
  headline: string;
  isPending: boolean;
};

export type MatchHistoryResult = {
  items: HistoryItem[];
  profileNames: Record<string, string>;
};

function getOpponentIdsFromMatch(match: Match, userId: string): string[] {
  return getOpponentIds(match, userId);
}

function buildHeadline(match: Match, nameMap: Record<string, string>): string {
  const team1Name = formatTeamName((match.team1_ids ?? []) as string[], nameMap);
  const team2Name = formatTeamName((match.team2_ids ?? []) as string[], nameMap);
  return `${team1Name} vs ${team2Name}`;
}

async function loadProfileNames(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  return Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
}

function collectParticipantIds(matches: Match[]): string[] {
  const ids = new Set<string>();
  for (const match of matches) {
    for (const id of [
      ...(match.team1_ids ?? []),
      ...(match.team2_ids ?? []),
      ...(match.winner_ids ?? []),
      ...(match.loser_ids ?? []),
    ]) {
      ids.add(id);
    }
  }
  return Array.from(ids);
}

function mapPendingItem(match: Match, userId: string, nameMap: Record<string, string>): HistoryItem {
  const changes = (match.rating_changes ?? {}) as Record<string, number>;
  const inWinners = (match.winner_ids ?? []).includes(userId);
  const inLosers = (match.loser_ids ?? []).includes(userId);

  return {
    rating_delta: changes[userId] ?? null,
    team: inWinners ? "winner" : inLosers ? "loser" : null,
    match,
    opponentNames: getOpponentIdsFromMatch(match, userId).map((id) => nameMap[id] ?? "?"),
    headline: buildHeadline(match, nameMap),
    isPending: true,
  };
}

export async function getPersonalMatchHistory(userId: string): Promise<MatchHistoryResult> {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("match_participants")
    .select(`
      rating_delta,
      team,
      matches (
        id,
        format,
        set_scores,
        winner_ids,
        loser_ids,
        team1_ids,
        team2_ids,
        winning_team,
        rating_changes,
        created_at,
        status
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false, referencedTable: "matches" });

  const confirmed: HistoryItem[] = (participations ?? [])
    .map((row) => {
      const match = row.matches as unknown as Match;
      return {
        rating_delta: row.rating_delta,
        team: row.team as "winner" | "loser",
        match,
        opponentNames: [] as string[],
        headline: "",
        isPending: false,
      };
    })
    .filter((item) => item.match?.id && item.match.status === "confirmed");

  const { data: pendingMatches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["pending", "counter_proposed"])
    .order("created_at", { ascending: false });

  const pending: HistoryItem[] = (pendingMatches ?? [])
    .filter((match) => {
      const team1 = (match.team1_ids ?? []) as string[];
      const team2 = (match.team2_ids ?? []) as string[];
      return [...team1, ...team2].includes(userId);
    })
    .map((match) => mapPendingItem(match as Match, userId, {}));

  const allMatches = [...confirmed.map((item) => item.match), ...pending.map((item) => item.match)];
  const nameMap = await loadProfileNames(collectParticipantIds(allMatches));

  const items = [...pending, ...confirmed]
    .map((item) => ({
      ...item,
      headline: buildHeadline(item.match, nameMap),
      opponentNames:
        item.opponentNames.length > 0
          ? item.opponentNames
          : getOpponentIdsFromMatch(item.match, userId).map((id) => nameMap[id] ?? "?"),
    }))
    .sort(
      (a, b) =>
        new Date(b.match.created_at).getTime() - new Date(a.match.created_at).getTime()
    );

  return { items, profileNames: nameMap };
}

export async function getGroupMatchHistory(): Promise<MatchHistoryResult> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["confirmed", "pending", "counter_proposed"])
    .order("created_at", { ascending: false });

  const typedMatches = (matches ?? []) as Match[];
  const nameMap = await loadProfileNames(collectParticipantIds(typedMatches));

  const items: HistoryItem[] = typedMatches.map((match) => ({
    rating_delta: null,
    team: null,
    match,
    opponentNames: [],
    headline: buildHeadline(match, nameMap),
    isPending: match.status === "pending" || match.status === "counter_proposed",
  }));

  return { items, profileNames: nameMap };
}

export async function getMatchHistory(userId: string): Promise<MatchHistoryResult> {
  return getPersonalMatchHistory(userId);
}

export async function getHeadToHead(userId: string, opponentId: string) {
  const supabase = await createClient();

  const { data: myMatches } = await supabase
    .from("match_participants")
    .select("match_id, team")
    .eq("user_id", userId);

  const myMatchIds = new Set((myMatches ?? []).map((m) => m.match_id));

  const { data: opponentMatches } = await supabase
    .from("match_participants")
    .select("match_id, team")
    .eq("user_id", opponentId);

  const sharedIds = (opponentMatches ?? [])
    .filter((m) => myMatchIds.has(m.match_id))
    .map((m) => m.match_id);

  if (!sharedIds.length) {
    return { wins: 0, losses: 0, gameDiff: 0, streakHolder: null as string | null, streak: 0 };
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("id", sharedIds)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  let wins = 0;
  let losses = 0;
  let gameDiff = 0;
  let streakHolder: string | null = null;
  let streak = 0;
  let streakStarted = false;

  for (const match of matches ?? []) {
    const userWon = match.winner_ids.includes(userId);
    if (userWon) wins++;
    else losses++;

    const setScores = match.set_scores as { p1: number; p2: number }[];
    for (const set of setScores) {
      if (match.winner_ids.includes(userId)) {
        gameDiff += set.p1 - set.p2;
      } else {
        gameDiff += set.p2 - set.p1;
      }
    }

    if (!streakStarted) {
      streakStarted = true;
      streakHolder = userWon ? userId : opponentId;
      streak = 1;
    } else if (
      (streakHolder === userId && userWon) ||
      (streakHolder === opponentId && !userWon)
    ) {
      streak++;
    } else {
      break;
    }
  }

  return { wins, losses, gameDiff, streakHolder, streak };
}

export async function getUserBadges(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
