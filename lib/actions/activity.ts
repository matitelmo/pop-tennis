"use server";

import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug } from "@/lib/community/context";
import type { CommunityLocale } from "@/lib/community/locale";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import { BADGE_DEFINITIONS_EN } from "@/lib/i18n/badges";
import {
  formatActivityBadgeSummary,
  formatActivityMatchSummary,
} from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { loadParticipantNames } from "@/lib/match/participant-names";

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

export async function getActivityFeed(
  communitySlug: string,
  limit = 20,
  options?: { showBadges?: boolean; locale?: CommunityLocale }
): Promise<ActivityItem[]> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return [];
  const showBadges = options?.showBadges ?? community.settings.show_badges;
  const locale = options?.locale ?? "es";
  const badgeDefs = locale === "en" ? BADGE_DEFINITIONS_EN : BADGE_DEFINITIONS;

  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, set_scores, winner_ids, loser_ids, rating_changes, created_at")
    .eq("community_id", community.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: badges } = showBadges
    ? await supabase
        .from("user_badges")
        .select("id, badge_code, user_id, unlocked_at, profiles(full_name)")
        .order("unlocked_at", { ascending: false })
        .limit(limit)
    : { data: [] };

  const allIds = new Set<string>();
  for (const m of matches ?? []) {
    for (const id of [
      ...(m.winner_ids as string[]),
      ...(m.loser_ids as string[]),
      ...((m as { team1_ids?: string[] }).team1_ids ?? []),
      ...((m as { team2_ids?: string[] }).team2_ids ?? []),
    ]) {
      allIds.add(id);
    }
  }

  const nameMap = await loadParticipantNames(Array.from(allIds));

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
      summary: formatActivityMatchSummary(locale, winners, losers, scores),
      deltas: m.rating_changes as Record<string, number> | null,
    };
  });

  const badgeItems: ActivityItem[] = (badges ?? []).map((b) => {
    const def = badgeDefs[b.badge_code as keyof typeof badgeDefs];
    const name =
      (b.profiles as unknown as { full_name: string } | null)?.full_name ??
      t(locale, "someone");
    return {
      type: "badge" as const,
      id: b.id,
      created_at: b.unlocked_at,
      summary: formatActivityBadgeSummary(locale, name, def?.label ?? b.badge_code),
      emoji: def?.emoji ?? "🏅",
      userId: b.user_id,
    };
  });

  return [...matchItems, ...badgeItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
