"use server";

import { createServiceClient } from "@/lib/supabase/admin";

export async function syncCommunityRatings(communityId: string): Promise<void> {
  const admin = createServiceClient();

  const [{ data: members }, { data: confirmedParts }] = await Promise.all([
    admin.from("community_members").select("user_id, base_rating").eq("community_id", communityId),
    admin
      .from("match_participants")
      .select("user_id, rating_delta, matches!inner(status, community_id)")
      .eq("matches.status", "confirmed")
      .eq("matches.community_id", communityId),
  ]);

  const confirmedSum = new Map<string, number>();
  for (const row of confirmedParts ?? []) {
    confirmedSum.set(
      row.user_id,
      (confirmedSum.get(row.user_id) ?? 0) + row.rating_delta
    );
  }

  await Promise.all(
    (members ?? []).map((member) => {
      const expectedRating = member.base_rating + (confirmedSum.get(member.user_id) ?? 0);

      return admin
        .from("community_members")
        .update({ rating: expectedRating })
        .eq("community_id", communityId)
        .eq("user_id", member.user_id);
    })
  );
}
