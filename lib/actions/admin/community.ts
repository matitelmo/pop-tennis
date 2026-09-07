"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/auth";
import { getCommunityBySlug } from "@/lib/community/context";
import {
  DEFAULT_COMMUNITY_SETTINGS,
  parseCommunitySettings,
  type CommunitySettings,
} from "@/lib/community/settings";
import { communityExists } from "@/lib/community/slugs";
import { isValidSlugFormat } from "@/lib/community/slug-format";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { createServiceClient } from "@/lib/supabase/admin";

export async function createCommunity(input: {
  name: string;
  slug: string;
  settings?: Partial<CommunitySettings>;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();

  if (!name || name.length < 2) {
    return { success: false, error: "El nombre debe tener al menos 2 caracteres" };
  }
  if (!isValidSlugFormat(slug)) {
    return { success: false, error: "Slug inválido (solo minúsculas, números y guiones)" };
  }
  if (await communityExists(slug)) {
    return { success: false, error: "Ese slug ya existe" };
  }

  const settings = { ...DEFAULT_COMMUNITY_SETTINGS, ...input.settings };
  const admin = createServiceClient();
  const { error } = await admin.from("communities").insert({
    name,
    slug,
    settings,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/communities");
  revalidatePath("/admin/communities");
  return { success: true };
}

export async function updateCommunitySettings(
  slug: string,
  partial: Partial<CommunitySettings>
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const merged = { ...community.settings, ...partial };
  const admin = createServiceClient();
  const { error } = await admin
    .from("communities")
    .update({ settings: merged })
    .eq("id", community.id);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(slug);
  revalidatePath("/admin/communities");
  revalidatePath(`/admin/communities/${slug}`);
  revalidatePath("/communities");
  return { success: true };
}

export async function updateCommunityName(
  slug: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { success: false, error: "El nombre debe tener al menos 2 caracteres" };
  }

  const community = await getCommunityBySlug(slug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const admin = createServiceClient();
  const { error } = await admin.from("communities").update({ name: trimmed }).eq("id", community.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/communities");
  revalidatePath("/admin/communities");
  revalidatePath(`/admin/communities/${slug}`);
  return { success: true };
}

export async function getCommunitySettingsForAdmin(slug: string) {
  const auth = await assertAdmin();
  if (!auth.success) return null;

  const community = await getCommunityBySlug(slug);
  if (!community) return null;

  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    settings: parseCommunitySettings(community.settings),
  };
}
