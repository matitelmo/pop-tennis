"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getInitialRating } from "@/lib/constants";
import type { Gender, SkillLevel } from "@/types/database";

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
  const fullName = (formData.get("fullName") as string)?.trim();
  const gender = formData.get("gender") as Gender;
  const skillLevel = formData.get("skillLevel") as SkillLevel;

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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/ranking`,
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

export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}
