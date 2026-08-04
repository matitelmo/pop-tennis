"use server";

import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_COPY } from "@/lib/copy";
import type { Profile } from "@/types/database";

export type InAppNotification = {
  id: string;
  type: "upset" | "rank_pass" | "inactivity";
  message: string;
};

export async function getInAppNotifications(
  profile: Profile,
  currentRank: number,
  entries: { id: string; full_name: string }[]
): Promise<InAppNotification[]> {
  const notifications: InAppNotification[] = [];
  const supabase = await createClient();

  const daysSinceLastMatch = Math.floor(
    (Date.now() - new Date(profile.last_match_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLastMatch === 13) {
    notifications.push({
      id: "inactivity-day13",
      type: "inactivity",
      message: NOTIFICATION_COPY.inactivityDay13,
    });
  }

  if (
    profile.last_seen_rank != null &&
    currentRank > profile.last_seen_rank &&
    profile.last_seen_rank > 0
  ) {
    const passer = entries[profile.last_seen_rank - 1];
    if (passer && passer.id !== profile.id) {
      notifications.push({
        id: `rank-pass-${passer.id}`,
        type: "rank_pass",
        message: NOTIFICATION_COPY.rankPass(passer.full_name),
      });
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - 3);

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("id, winner_ids, loser_ids, rating_changes, created_at")
    .eq("status", "confirmed")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  for (const match of recentMatches ?? []) {
    const changes = match.rating_changes as Record<string, number> | null;
    if (!changes) continue;

    const winnerIds = match.winner_ids as string[];
    const upsetWinner = winnerIds.find((id) => (changes[id] ?? 0) >= 40);
    if (!upsetWinner) continue;

    const { data: names } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...winnerIds, ...(match.loser_ids as string[])]);

    const nameMap = Object.fromEntries((names ?? []).map((n) => [n.id, n.full_name]));
    const winnerName = nameMap[upsetWinner] ?? "Alguien";
    const loserName =
      nameMap[(match.loser_ids as string[]).find((id) => id !== upsetWinner) ?? ""] ?? "alguien";

    notifications.push({
      id: `upset-${match.id}`,
      type: "upset",
      message: NOTIFICATION_COPY.upset(winnerName, loserName),
    });
    break;
  }

  return notifications;
}
