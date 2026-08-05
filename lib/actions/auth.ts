"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getInitialRating } from "@/lib/constants";
import type { SkillLevel } from "@/types/database";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/ranking");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const skillLevel = formData.get("skillLevel") as SkillLevel;
  const rosterPlayerId = formData.get("rosterPlayerId") as string | null;
  const newDisplayName = (formData.get("newDisplayName") as string | null)?.trim();

  if (!rosterPlayerId && !newDisplayName) {
    return { error: "Elegí un jugador del roster o ingresá un nombre nuevo" };
  }

  if (newDisplayName && newDisplayName.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres" };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "No se pudo crear la cuenta" };

  const admin = createServiceClient();
  const rating = getInitialRating(skillLevel);
  let displayName: string;
  let linkedRosterId: string;

  if (rosterPlayerId) {
    const { data: slot, error: slotError } = await admin
      .from("roster_players")
      .select("*")
      .eq("id", rosterPlayerId)
      .is("claimed_by", null)
      .maybeSingle();

    if (slotError || !slot) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: "Ese jugador ya fue reclamado o no existe" };
    }

    displayName = slot.display_name;
    linkedRosterId = slot.id;

    const { error: claimError } = await admin
      .from("roster_players")
      .update({ claimed_by: authData.user.id, claimed_at: new Date().toISOString() })
      .eq("id", slot.id)
      .is("claimed_by", null);

    if (claimError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: "No se pudo reclamar el jugador. Probá de nuevo." };
    }
  } else {
    displayName = newDisplayName!;

    const { data: existing } = await admin
      .from("roster_players")
      .select("id")
      .ilike("display_name", displayName)
      .maybeSingle();

    if (existing) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: "Ese nombre ya está en la banda" };
    }

    const { data: created, error: createError } = await admin
      .from("roster_players")
      .insert({
        display_name: displayName,
        suggested_skill_level: skillLevel,
        suggested_rating: rating,
        is_preset: false,
        claimed_by: authData.user.id,
        claimed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError || !created) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: createError?.message ?? "No se pudo crear el jugador" };
    }

    linkedRosterId = created.id;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    full_name: displayName,
    skill_level: skillLevel,
    rating,
    base_rating: rating,
    last_match_at: new Date().toISOString(),
    roster_player_id: linkedRosterId,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  redirect("/ranking");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateLastSeenRank(userId: string, rank: number) {
  const admin = createServiceClient();
  await admin
    .from("profiles")
    .update({
      last_seen_rank: rank,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
