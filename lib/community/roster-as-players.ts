import type { Profile, RosterPlayer, SkillLevel } from "@/types/database";

/** Profile-shaped row for unclaimed roster slots (no auth account yet). */
export type RosterPickableProfile = Profile & {
  isRosterOnly: true;
};

export function rosterToPickableProfile(roster: RosterPlayer): RosterPickableProfile {
  const now = new Date().toISOString();
  return {
    id: roster.id,
    full_name: roster.display_name,
    avatar_url: null,
    skill_level: roster.suggested_skill_level as SkillLevel,
    gender: null,
    rating: roster.suggested_rating,
    base_rating: roster.suggested_rating,
    last_match_at: now,
    last_decay_at: null,
    created_at: roster.created_at,
    roster_player_id: roster.id,
    last_seen_rank: null,
    last_seen_at: null,
    subscription_status: "none",
    stripe_customer_id: null,
    weekly_opt_in: false,
    availability: null,
    isRosterOnly: true,
  };
}

export function isRosterOnlyProfile(
  profile: Profile & { isRosterOnly?: boolean }
): profile is RosterPickableProfile {
  return Boolean(profile.isRosterOnly);
}
