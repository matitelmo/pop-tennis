"use server";

import { createClient } from "@/lib/supabase/server";

export type RosterPlayer = {
  id: string;
  display_name: string;
  suggested_skill_level: string;
  suggested_rating: number;
  is_preset: boolean;
  claimed_by: string | null;
};

export async function getAvailableRosterPlayers(): Promise<RosterPlayer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roster_players")
    .select("id, display_name, suggested_skill_level, suggested_rating, is_preset, claimed_by")
    .is("claimed_by", null)
    .order("is_preset", { ascending: false })
    .order("display_name");

  return (data ?? []) as RosterPlayer[];
}

export async function isDisplayNameTaken(name: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roster_players")
    .select("id")
    .ilike("display_name", name.trim())
    .maybeSingle();

  return !!data;
}
