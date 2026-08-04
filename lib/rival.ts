import type { Profile } from "@/types/database";
import { isRivalidadPareja } from "@/lib/paternidad";
import { getWeekStart } from "@/lib/share";

export type RivalSuggestion = {
  profile: Profile;
  eloDiff: number;
};

export type H2HRecord = { wins: number; losses: number };

export function suggestRivalOfTheWeek(
  currentUser: Profile,
  allProfiles: Profile[],
  playedThisWeekUserIds: Set<string>,
  recentOpponentIds: Set<string>,
  h2hByOpponent: Record<string, H2HRecord> = {}
): RivalSuggestion | null {
  const candidates = allProfiles
    .filter((p) => p.id !== currentUser.id)
    .filter((p) => !playedThisWeekUserIds.has(p.id))
    .filter((p) => !recentOpponentIds.has(p.id))
    .map((p) => {
      const h2h = h2hByOpponent[p.id];
      const rivalidadBoost =
        h2h && isRivalidadPareja(h2h.wins, h2h.losses) ? -200 : 0;
      return {
        profile: p,
        eloDiff: Math.abs(p.rating - currentUser.rating) + rivalidadBoost,
      };
    })
    .sort((a, b) => a.eloDiff - b.eloDiff);

  return candidates[0] ?? null;
}

export function getPlayNudgeDays(lastMatchAt: string): {
  type: "none" | "nudge" | "ghost";
  days: number;
} {
  const days = Math.floor(
    (Date.now() - new Date(lastMatchAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days >= 14) return { type: "ghost", days };
  if (days >= 5) return { type: "nudge", days };
  return { type: "none", days };
}

export { getWeekStart };
