"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug } from "@/lib/community/context";
import { getInitialRating } from "@/lib/constants";
import { communityPath, revalidateCommunityPaths } from "@/lib/community/paths";
import type { Gender, SkillLevel } from "@/types/database";

export async function joinCommunity(
  slug: string,
  options?: { skillLevel?: SkillLevel; gender?: Gender | null }
): Promise<{ success: boolean; error?: string }> {
  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("community_members")
    .select("user_id")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Ya sos miembro de esta comunidad" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("skill_level, gender")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Perfil no encontrado" };

  const skillLevel = options?.skillLevel ?? profile.skill_level;
  const rating = getInitialRating(skillLevel);

  const { error } = await admin.from("community_members").insert({
    community_id: community.id,
    user_id: user.id,
    rating,
    base_rating: rating,
    subscription_status: "none",
    weekly_opt_in: community.settings.weekly_rival_mode === "auto",
    last_match_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  if (options?.gender && !profile.gender) {
    await admin.from("profiles").update({ gender: options.gender }).eq("id", user.id);
  }

  revalidateCommunityPaths(slug);
  revalidatePath("/communities");
  return { success: true };
}

export async function joinCommunityAndRedirect(slug: string): Promise<void> {
  const result = await joinCommunity(slug);
  if (!result.success) {
    redirect(communityPath(slug, "ranking"));
  }
  redirect(communityPath(slug, "ranking"));
}
