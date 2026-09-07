"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/auth";
import { getCommunityBySlug } from "@/lib/community/context";
import { applyConfirmedMatch } from "@/lib/match/apply-match";
import { revalidateCommunityPaths } from "@/lib/community/paths";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Match, MatchStatus } from "@/types/database";

export async function getAdminMatches(options?: {
  communitySlug?: string;
  status?: MatchStatus | "all";
  limit?: number;
}): Promise<Match[]> {
  const auth = await assertAdmin();
  if (!auth.success) return [];

  const admin = createServiceClient();
  let query = admin.from("matches").select("*").order("created_at", { ascending: false });

  if (options?.communitySlug) {
    const community = await getCommunityBySlug(options.communitySlug);
    if (community) query = query.eq("community_id", community.id);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  query = query.limit(options?.limit ?? 50);

  const { data } = await query;
  return data ?? [];
}

export async function adminForceConfirmMatch(
  communitySlug: string,
  matchId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const admin = createServiceClient();
  const { data: match } = await admin.from("matches").select("*").eq("id", matchId).single();

  if (!match) return { success: false, error: "Partido no encontrado" };
  if (match.status === "confirmed") {
    return { success: false, error: "El partido ya está confirmado" };
  }

  const result = await applyConfirmedMatch(matchId, auth.profile.id);
  if (!result.success) return result;

  revalidateCommunityPaths(communitySlug);
  revalidatePath("/admin/matches");
  revalidatePath("/admin/disputes");
  return { success: true };
}

export async function adminDeleteMatch(
  communitySlug: string,
  matchId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const admin = createServiceClient();
  const { error } = await admin.from("matches").delete().eq("id", matchId);

  if (error) return { success: false, error: error.message };

  revalidateCommunityPaths(communitySlug);
  revalidatePath("/admin/matches");
  revalidatePath("/admin/disputes");
  return { success: true };
}

export async function getAdminMatchContext(matches: Match[]) {
  const auth = await assertAdmin();
  if (!auth.success) {
    return { profileNames: {}, communitySlugs: {} };
  }

  const admin = createServiceClient();
  const allIds = matches.flatMap((m) => [
    ...((m.team1_ids as string[]) ?? []),
    ...((m.team2_ids as string[]) ?? []),
    m.submitted_by,
  ]);
  const communityIds = Array.from(
    new Set(matches.map((m) => m.community_id).filter(Boolean) as string[])
  );

  const [{ data: profiles }, { data: communities }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(new Set(allIds.filter(Boolean)))),
    communityIds.length
      ? admin.from("communities").select("id, slug").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; slug: string }[] }),
  ]);

  return {
    profileNames: Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    communitySlugs: Object.fromEntries((communities ?? []).map((c) => [c.id, c.slug])),
  };
}
