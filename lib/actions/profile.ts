"use server";

import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getCommunityLocale } from "@/lib/community/locale";

export async function updatePhoneNumber(
  communitySlug: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  const locale = getCommunityLocale(communitySlug);
  const trimmed = phoneNumber.trim();
  if (trimmed.length < 7) {
    return {
      success: false,
      error: locale === "en" ? "Enter a valid phone number" : "Ingresá un teléfono válido",
    };
  }

  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { success: false, error: "Community not found" };

  const profile = await getCurrentUserProfile();
  if (!profile) return { success: false, error: "Not authenticated" };

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) return { success: false, error: "Not a member" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ phone_number: trimmed })
    .eq("id", profile.id);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}
