"use server";

import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { hasAvailabilityOverlap } from "@/lib/availability";
import type { Availability, Profile } from "@/types/database";

export async function updateAvailability(
  communitySlug: string,
  availability: Availability
): Promise<{ success: boolean; error?: string }> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { success: false, error: "Comunidad no encontrada" };

  const profile = await getCurrentUserProfile();
  if (!profile) return { success: false, error: "No autenticado" };

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) return { success: false, error: "No sos miembro de esta comunidad" };

  if (community.settings.requires_subscription && !hasActiveSubscription(member)) {
    return { success: false, error: "Necesitás suscripción activa para configurar disponibilidad" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .update({ availability })
    .eq("community_id", community.id)
    .eq("user_id", profile.id);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(communitySlug);
  return { success: true };
}

export async function getPlayersWithSimilarAvailability(
  communitySlug: string
): Promise<(Profile & { overlapDays: number })[]> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return [];

  const profile = await getCurrentUserProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("community_members")
    .select("availability")
    .eq("community_id", community.id)
    .eq("user_id", profile.id)
    .single();

  const myAvailability = member?.availability as Availability | null;
  if (!myAvailability) return [];

  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, availability, profile:profiles(*)")
    .eq("community_id", community.id)
    .neq("user_id", profile.id)
    .not("availability", "is", null);

  const results: (Profile & { overlapDays: number })[] = [];

  for (const row of members ?? []) {
    const p = row.profile as unknown as Profile;
    const theirAvailability = row.availability as Availability;
    if (!hasAvailabilityOverlap(myAvailability, theirAvailability)) continue;
    let overlapDays = 0;
    for (const day of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
      const a = myAvailability?.[day] ?? [];
      const b = theirAvailability?.[day] ?? [];
      if (a.some((block: string) => b.includes(block))) overlapDays++;
    }
    results.push({ ...p, overlapDays });
  }

  return results.sort((a, b) => b.overlapDays - a.overlapDays);
}
