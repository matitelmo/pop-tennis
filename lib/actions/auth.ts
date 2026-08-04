"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const skillLevel = formData.get("skillLevel") as SkillLevel;
  const inviteCode = formData.get("inviteCode") as string;

  const expectedCode = process.env.NEXT_PUBLIC_GROUP_INVITE_CODE;
  if (expectedCode && inviteCode !== expectedCode) {
    return { error: "Código de invitación inválido" };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "No se pudo crear la cuenta" };

  const rating = getInitialRating(skillLevel);

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    skill_level: skillLevel,
    rating,
    base_rating: rating,
    last_match_at: new Date().toISOString(),
  });

  if (profileError) return { error: profileError.message };

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
