"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/auth";
import { getCommunityBySlug, getCommunityMembers } from "@/lib/community/context";
import { getInitialRating } from "@/lib/constants";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { createServiceClient } from "@/lib/supabase/admin";
import type { SkillLevel, SubscriptionStatus } from "@/types/database";

export type AdminUserSearchResult = {
  id: string;
  email: string;
  full_name: string;
};

export async function searchUsersByEmail(
  query: string
): Promise<AdminUserSearchResult[]> {
  const auth = await assertAdmin();
  if (!auth.success) return [];

  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  const admin = createServiceClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 200 });
  const matching = (usersData?.users ?? []).filter((u) => u.email?.toLowerCase().includes(q));

  if (!matching.length) return [];

  const ids = matching.map((u) => u.id);
  const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", ids);
  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return matching.slice(0, 10).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    full_name: nameMap[u.id] ?? u.email ?? "Sin nombre",
  }));
}

export async function getCommunityMembersForAdmin(slug: string) {
  const auth = await assertAdmin();
  if (!auth.success) return [];

  const community = await getCommunityBySlug(slug);
  if (!community) return [];

  return getCommunityMembers(community.id);
}

export async function addMemberToCommunity(
  slug: string,
  userId: string,
  options?: { skillLevel?: SkillLevel; rating?: number }
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("community_members")
    .select("user_id")
    .eq("community_id", community.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { success: false, error: "El usuario ya es miembro" };

  const { data: profile } = await admin
    .from("profiles")
    .select("skill_level")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { success: false, error: "Perfil no encontrado" };

  const skillLevel = options?.skillLevel ?? profile.skill_level;
  const rating = options?.rating ?? getInitialRating(skillLevel);

  const { error } = await admin.from("community_members").insert({
    community_id: community.id,
    user_id: userId,
    rating,
    base_rating: rating,
    subscription_status: "none",
    weekly_opt_in: community.settings.weekly_rival_mode === "auto",
    last_match_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(slug);
  revalidatePath(`/admin/communities/${slug}/members`);
  return { success: true };
}

export async function updateMemberRating(
  slug: string,
  userId: string,
  rating: number,
  baseRating?: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("community_members")
    .update({
      rating,
      base_rating: baseRating ?? rating,
    })
    .eq("community_id", community.id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(slug);
  revalidatePath(`/admin/communities/${slug}/members`);
  return { success: true };
}

export async function setMemberSubscription(
  slug: string,
  userId: string,
  status: SubscriptionStatus
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("community_members")
    .update({ subscription_status: status })
    .eq("community_id", community.id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(slug);
  revalidatePath(`/admin/communities/${slug}/members`);
  return { success: true };
}

export async function removeMemberFromCommunity(
  slug: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const admin = createServiceClient();
  const { data: disputedMatches } = await admin
    .from("matches")
    .select("team1_ids, team2_ids, submitted_by")
    .eq("community_id", community.id)
    .eq("status", "disputed");

  const inDispute = (disputedMatches ?? []).some((m) => {
    const ids = [
      ...((m.team1_ids as string[]) ?? []),
      ...((m.team2_ids as string[]) ?? []),
      m.submitted_by,
    ].filter(Boolean);
    return ids.includes(userId);
  });

  if (inDispute) {
    return { success: false, error: "El usuario tiene partidos en disputa" };
  }

  const { error } = await admin
    .from("community_members")
    .delete()
    .eq("community_id", community.id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(slug);
  revalidatePath(`/admin/communities/${slug}/members`);
  return { success: true };
}
