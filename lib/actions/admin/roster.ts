"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/auth";
import { getCommunityBySlug } from "@/lib/community/context";
import { getInitialRating } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/admin";
import type { RosterPlayer, SkillLevel } from "@/types/database";

export async function getRosterForCommunity(slug: string): Promise<RosterPlayer[]> {
  const auth = await assertAdmin();
  if (!auth.success) return [];

  const community = await getCommunityBySlug(slug);
  if (!community) return [];

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("roster_players")
    .select("*")
    .eq("community_id", community.id)
    .order("display_name");

  if (error) {
    console.error("getRosterForCommunity:", error.message);
    return [];
  }

  return data ?? [];
}

export async function createRosterPreset(
  slug: string,
  input: {
    displayName: string;
    skillLevel: SkillLevel;
    rating?: number;
    isPreset?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return { success: false, error: "El nombre debe tener al menos 2 caracteres" };
  }

  const rating = input.rating ?? getInitialRating(input.skillLevel);
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("roster_players")
    .select("id")
    .eq("community_id", community.id)
    .ilike("display_name", displayName)
    .maybeSingle();

  if (existing) return { success: false, error: "Ese nombre ya existe en el roster" };

  const { error } = await admin.from("roster_players").insert({
    community_id: community.id,
    display_name: displayName,
    suggested_skill_level: input.skillLevel,
    suggested_rating: rating,
    is_preset: input.isPreset ?? true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/roster");
  return { success: true };
}

export async function updateRosterPreset(
  id: string,
  fields: {
    displayName?: string;
    skillLevel?: SkillLevel;
    rating?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("roster_players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { success: false, error: "Jugador no encontrado" };
  if (row.claimed_by) return { success: false, error: "No se puede editar un jugador ya reclamado" };

  const update: Record<string, unknown> = {};
  if (fields.displayName !== undefined) update.display_name = fields.displayName.trim();
  if (fields.skillLevel !== undefined) update.suggested_skill_level = fields.skillLevel;
  if (fields.rating !== undefined) update.suggested_rating = fields.rating;

  const { error } = await admin.from("roster_players").update(update).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/roster");
  return { success: true };
}

export async function deleteRosterPreset(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("roster_players")
    .select("claimed_by")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { success: false, error: "Jugador no encontrado" };
  if (row.claimed_by) return { success: false, error: "No se puede borrar un jugador reclamado" };

  const { error } = await admin.from("roster_players").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/roster");
  return { success: true };
}
