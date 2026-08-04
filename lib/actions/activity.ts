"use server";

import { createClient } from "@/lib/supabase/server";
import { BADGE_DEFINITIONS } from "@/lib/constants";

export type ActivityItem =
  | {
      type: "match";
      id: string;
      created_at: string;
      summary: string;
      deltas: Record<string, number> | null;
      matchId: string;
    }
  | {
      type: "badge";
      id: string;
      created_at: string;
      summary: string;
      emoji: string;
      userId: string;
    };

export async function getActivityFeed(limit = 20): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, set_scores, winner_ids, loser_ids, rating_changes, created_at")
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: badges } = await supabase
    .from("user_badges")
    .select("id, badge_code, user_id, unlocked_at, profiles(full_name)")
    .order("unlocked_at", { ascending: false })
    .limit(limit);

  const allIds = new Set<string>();
  for (const m of matches ?? []) {
    for (const id of [...(m.winner_ids as string[]), ...(m.loser_ids as string[])]) {
      allIds.add(id);
    }
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(allIds));

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  const matchItems: ActivityItem[] = (matches ?? []).map((m) => {
    const scores = (m.set_scores as { p1: number; p2: number }[])
      .map((s) => `${s.p1}-${s.p2}`)
      .join(" · ");
    const winners = (m.winner_ids as string[]).map((id) => nameMap[id] ?? "?").join(" & ");
    const losers = (m.loser_ids as string[]).map((id) => nameMap[id] ?? "?").join(" & ");
    return {
      type: "match" as const,
      id: m.id,
      matchId: m.id,
      created_at: m.created_at,
      summary: `${winners} le ganó a ${losers} (${scores})`,
      deltas: m.rating_changes as Record<string, number> | null,
    };
  });

  const badgeItems: ActivityItem[] = (badges ?? []).map((b) => {
    const def = BADGE_DEFINITIONS[b.badge_code as keyof typeof BADGE_DEFINITIONS];
    const name =
      (b.profiles as unknown as { full_name: string } | null)?.full_name ?? "Alguien";
    return {
      type: "badge" as const,
      id: b.id,
      created_at: b.unlocked_at,
      summary: `${name} desbloqueó ${def?.label ?? b.badge_code}`,
      emoji: def?.emoji ?? "🏅",
      userId: b.user_id,
    };
  });

  return [...matchItems, ...badgeItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
