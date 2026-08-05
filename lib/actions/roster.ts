"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import type { RosterPlayer as DbRosterPlayer } from "@/types/database";

export type RosterPlayer = {
  id: string;
  display_name: string;
  suggested_skill_level: string;
  suggested_rating: number;
  is_preset: boolean;
  claimed_by: string | null;
};

export async function getAllRosterPlayers(): Promise<DbRosterPlayer[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("roster_players")
    .select("*")
    .order("display_name");

  if (error) {
    console.error("getAllRosterPlayers:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAvailableRosterPlayers(): Promise<RosterPlayer[]> {
  const players = await getAllRosterPlayers();
  return players
    .filter((p) => !p.claimed_by)
    .map((p) => ({
      id: p.id,
      display_name: p.display_name,
      suggested_skill_level: p.suggested_skill_level,
      suggested_rating: p.suggested_rating,
      is_preset: p.is_preset,
      claimed_by: p.claimed_by,
    }))
    .sort((a, b) => {
      if (a.is_preset !== b.is_preset) return a.is_preset ? -1 : 1;
      return a.display_name.localeCompare(b.display_name, "es");
    });
}

export async function isDisplayNameTaken(name: string): Promise<boolean> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("roster_players")
    .select("id")
    .ilike("display_name", name.trim())
    .maybeSingle();

  const { data: profileMatch } = await admin
    .from("profiles")
    .select("id")
    .ilike("full_name", name.trim())
    .maybeSingle();

  return !!data || !!profileMatch;
}
