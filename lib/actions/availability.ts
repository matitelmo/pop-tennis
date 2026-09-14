"use server";

import { createClient } from "@/lib/supabase/server";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { hasAvailabilityOverlap } from "@/lib/availability";
import type { Availability, Profile } from "@/types/database";

export type AvailabilityPlayer = Pick<Profile, "id" | "full_name" | "skill_level" | "phone_number"> & {
  overlapDays: number;
  rating: number;
  rank: number;
};

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

  // Any active member can set availability (used for player finder).

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

export async function findPlayersByAvailability(
  communitySlug: string,
  day: string,
  block: string
): Promise<{ players: AvailabilityPlayer[]; error?: string }> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return { players: [], error: "Community not found" };

  const profile = await getCurrentUserProfile();
  if (!profile) return { players: [], error: "Not authenticated" };

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) return { players: [], error: "Not a member" };

  // Finder is open to all members; challenging may still require subscription on paid leagues.

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const validHours = Array.from({ length: 14 }, (_, i) => String(i + 7));
  if (!validDays.includes(day) || !validHours.includes(block)) {
    return { players: [], error: "Invalid filter" };
  }

  const supabase = await createClient();
  const [{ data: members }, { data: allMembers }] = await Promise.all([
    supabase
      .from("community_members")
      .select("user_id, availability, rating, profile:profiles(id, full_name, skill_level, phone_number)")
      .eq("community_id", community.id)
      .neq("user_id", profile.id)
      .not("availability", "is", null),
    supabase
      .from("community_members")
      .select("user_id, rating")
      .eq("community_id", community.id)
      .order("rating", { ascending: false }),
  ]);

  const rankByUser = new Map(
    (allMembers ?? []).map((m, index) => [m.user_id, index + 1])
  );

  const players: AvailabilityPlayer[] = [];

  for (const row of members ?? []) {
    const p = row.profile as unknown as Pick<
      Profile,
      "id" | "full_name" | "skill_level" | "phone_number"
    >;
    const availability = row.availability as Availability;
    const dayBlocks = availability[day] ?? [];
    if (!dayBlocks.includes(block)) continue;

    let overlapDays = 0;
    const myAvailability = member.availability as Availability | null;
    if (myAvailability) {
      for (const d of validDays) {
        const a = myAvailability[d] ?? [];
        const b = availability[d] ?? [];
        if (a.some((bl) => b.includes(bl))) overlapDays++;
      }
    }

    players.push({
      id: p.id,
      full_name: p.full_name,
      skill_level: p.skill_level,
      phone_number: p.phone_number,
      overlapDays,
      rating: row.rating as number,
      rank: rankByUser.get(p.id) ?? 0,
    });
  }

  return {
    players: players.sort(
      (a, b) =>
        b.rating - a.rating ||
        b.overlapDays - a.overlapDays ||
        a.full_name.localeCompare(b.full_name)
    ),
  };
}
