"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug } from "@/lib/community/context";
import { communityPath, DEFAULT_COMMUNITY_SLUG } from "@/lib/community/paths";
import { getInitialRating } from "@/lib/constants";
import type { Gender, SkillLevel } from "@/types/database";

async function resolveCommunitySlug(formData: FormData): Promise<string> {
  const fromForm = (formData.get("community") as string | null)?.trim();
  if (fromForm) return fromForm;
  return DEFAULT_COMMUNITY_SLUG;
}

async function insertCommunityMember(
  communityId: string,
  userId: string,
  rating: number,
  weeklyOptIn: boolean
) {
  const admin = createServiceClient();
  return admin.from("community_members").insert({
    community_id: communityId,
    user_id: userId,
    rating,
    base_rating: rating,
    subscription_status: "none",
    weekly_opt_in: weeklyOptIn,
    last_match_at: new Date().toISOString(),
  });
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const communitySlug = await resolveCommunitySlug(formData);
  const nextPath = (formData.get("next") as string | null)?.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    redirect(nextPath);
  }

  redirect(communityPath(communitySlug, "ranking"));
}

export async function register(formData: FormData) {
  const communitySlug = await resolveCommunitySlug(formData);
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { error: "Comunidad no encontrada" };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const skillLevel = formData.get("skillLevel") as SkillLevel;

  if (community.settings.signup_mode === "roster") {
    return registerRoster(formData, community.id, communitySlug, email, password, skillLevel);
  }

  return registerOpen(formData, community.id, communitySlug, email, password, skillLevel);
}

async function registerRoster(
  formData: FormData,
  communityId: string,
  communitySlug: string,
  email: string,
  password: string,
  skillLevel: SkillLevel
) {
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
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${communityPath(communitySlug, "ranking")}`,
    },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "No se pudo crear la cuenta" };

  const admin = createServiceClient();
  let resolvedSkillLevel = skillLevel;
  let rating = getInitialRating(skillLevel);
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
    rating = slot.suggested_rating;
    resolvedSkillLevel = slot.suggested_skill_level as SkillLevel;

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
      .eq("community_id", communityId)
      .ilike("display_name", displayName)
      .maybeSingle();

    if (existing) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: "Ese nombre ya está en la banda" };
    }

    const { data: created, error: createError } = await admin
      .from("roster_players")
      .insert({
        community_id: communityId,
        display_name: displayName,
        suggested_skill_level: resolvedSkillLevel,
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
    skill_level: resolvedSkillLevel,
    rating,
    base_rating: rating,
    last_match_at: new Date().toISOString(),
    roster_player_id: linkedRosterId,
    subscription_status: "none",
    weekly_opt_in: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  const { error: memberError } = await insertCommunityMember(
    communityId,
    authData.user.id,
    rating,
    true
  );

  if (memberError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: memberError.message };
  }

  redirect(communityPath(communitySlug, "ranking"));
}

async function registerOpen(
  formData: FormData,
  communityId: string,
  communitySlug: string,
  email: string,
  password: string,
  skillLevel: SkillLevel
) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const gender = formData.get("gender") as Gender;

  if (!fullName || fullName.length < 2) {
    return { error: "Ingresá tu nombre completo (mínimo 2 caracteres)" };
  }

  if (gender !== "male" && gender !== "female") {
    return { error: "Elegí una categoría (Hombres o Mujeres)" };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${communityPath(communitySlug, "ranking")}`,
    },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "No se pudo crear la cuenta" };

  const admin = createServiceClient();
  const rating = getInitialRating(skillLevel);

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    gender,
    skill_level: skillLevel,
    rating,
    base_rating: rating,
    last_match_at: new Date().toISOString(),
    subscription_status: "none",
    weekly_opt_in: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  const { error: memberError } = await insertCommunityMember(
    communityId,
    authData.user.id,
    rating,
    false
  );

  if (memberError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: memberError.message };
  }

  redirect(communityPath(communitySlug, "ranking"));
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

export async function updateLastSeenRank(
  communityId: string,
  userId: string,
  rank: number
) {
  const admin = createServiceClient();
  await admin
    .from("community_members")
    .update({
      last_seen_rank: rank,
      last_seen_at: new Date().toISOString(),
    })
    .eq("community_id", communityId)
    .eq("user_id", userId);
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}
