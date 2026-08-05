"use server";

import { createClient } from "@/lib/supabase/server";
import type { SkillLevel } from "@/types/database";

export type ViewablePlayer = {
  id: string;
  full_name: string;
  skill_level: SkillLevel;
  rating: number;
  base_rating: number;
  avatar_url: string | null;
  isUnclaimed: boolean;
  created_at: string;
};

export type ViewablePlayerResult =
  | { kind: "player"; player: ViewablePlayer }
  | { kind: "redirect"; redirectTo: string };

export async function getViewablePlayer(
  id: string
): Promise<ViewablePlayerResult | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (profile) {
    return {
      kind: "player",
      player: {
        id: profile.id,
        full_name: profile.full_name,
        skill_level: profile.skill_level,
        rating: profile.rating,
        base_rating: profile.base_rating,
        avatar_url: profile.avatar_url,
        isUnclaimed: false,
        created_at: profile.created_at,
      },
    };
  }

  const { data: roster } = await supabase
    .from("roster_players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!roster) return null;

  if (roster.claimed_by) {
    return { kind: "redirect", redirectTo: `/perfil/${roster.claimed_by}` };
  }

  return {
    kind: "player",
    player: {
      id: roster.id,
      full_name: roster.display_name,
      skill_level: roster.suggested_skill_level as SkillLevel,
      rating: roster.suggested_rating,
      base_rating: roster.suggested_rating,
      avatar_url: null,
      isUnclaimed: true,
      created_at: roster.created_at,
    },
  };
}
