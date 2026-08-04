import type { Profile } from "@/types/database";
import { getWeekStart } from "@/lib/share";

export type RivalSuggestion = {
  profile: Profile;
  eloDiff: number;
};

export function suggestRivalOfTheWeek(
  currentUser: Profile,
  allProfiles: Profile[],
  playedThisWeekUserIds: Set<string>,
  recentOpponentIds: Set<string>
): RivalSuggestion | null {
  const candidates = allProfiles
    .filter((p) => p.id !== currentUser.id)
    .filter((p) => !playedThisWeekUserIds.has(p.id))
    .filter((p) => !recentOpponentIds.has(p.id))
    .map((p) => ({
      profile: p,
      eloDiff: Math.abs(p.rating - currentUser.rating),
    }))
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
