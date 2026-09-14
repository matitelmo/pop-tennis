"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { getCommunityBySlug } from "@/lib/community/context";
import { getCurrentUserProfile } from "@/lib/actions/auth";

export type IncomingChallenge = {
  id: string;
  fromUserId: string;
  fromName: string;
  createdAt: string;
};

export async function getIncomingChallenges(
  communitySlug: string
): Promise<IncomingChallenge[]> {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return [];

  const profile = await getCurrentUserProfile();
  if (!profile) return [];

  const admin = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: rows } = await admin
    .from("challenges")
    .select("id, from_user_id, created_at")
    .eq("community_id", community.id)
    .eq("to_user_id", profile.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (!rows?.length) return [];

  const fromIds = Array.from(new Set(rows.map((r) => r.from_user_id)));
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", fromIds);

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((row) => ({
    id: row.id,
    fromUserId: row.from_user_id,
    fromName: nameMap[row.from_user_id] ?? "Someone",
    createdAt: row.created_at,
  }));
}
