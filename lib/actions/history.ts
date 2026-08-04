"use server";

import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";

export type HistoryItem = {
  rating_delta: number | null;
  team: "winner" | "loser" | null;
  match: Match;
  opponentNames: string[];
  isPending: boolean;
};

function getOpponentIds(match: Match, userId: string): string[] {
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

export async function getMatchHistory(userId: string): Promise<HistoryItem[]> {
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
        created_at,
        status
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false, referencedTable: "matches" });

  const confirmed: HistoryItem[] = (participations ?? [])
    .map((p) => {
      const match = p.matches as unknown as Match;
      return {
        rating_delta: p.rating_delta,
        team: p.team as "winner" | "loser",
        match,
        opponentNames: [] as string[],
        isPending: false,
      };
    })
    .filter((p) => p.match?.id && p.match.status === "confirmed");

  const { data: pendingMatches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["pending", "counter_proposed"])
    .order("created_at", { ascending: false });

  const pending: HistoryItem[] = (pendingMatches ?? [])
    .filter((m) => {
      const team1 = (m.team1_ids ?? []) as string[];
      const team2 = (m.team2_ids ?? []) as string[];
      return [...team1, ...team2].includes(userId);
    })
    .map((m) => ({
      rating_delta: null,
      team: null,
      match: m as Match,
      opponentNames: [] as string[],
      isPending: true,
    }));

  const all = [...pending, ...confirmed];
  const oppIds = new Set<string>();
  for (const item of all) {
    for (const id of getOpponentIds(item.match, userId)) {
      oppIds.add(id);
    }
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(oppIds));

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return all
    .map((item) => ({
      ...item,
      opponentNames: getOpponentIds(item.match, userId).map((id) => nameMap[id] ?? "?"),
    }))
    .sort(
      (a, b) =>
        new Date(b.match.created_at).getTime() - new Date(a.match.created_at).getTime()
    );
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
