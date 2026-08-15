"use server";

import { createServiceClient } from "@/lib/supabase/admin";

export async function syncProfileRatings(): Promise<void> {
  const admin = createServiceClient();

  const [{ data: profiles }, { data: confirmedParts }] = await Promise.all([
    admin.from("profiles").select("id, base_rating"),
    admin
      .from("match_participants")
      .select("user_id, rating_delta, matches!inner(status)")
      .eq("matches.status", "confirmed"),
  ]);

  const confirmedSum = new Map<string, number>();
  for (const row of confirmedParts ?? []) {
    confirmedSum.set(
      row.user_id,
      (confirmedSum.get(row.user_id) ?? 0) + row.rating_delta
    );
  }

  await Promise.all(
    (profiles ?? []).map((profile) => {
      const expectedRating = profile.base_rating + (confirmedSum.get(profile.id) ?? 0);

      return admin
        .from("profiles")
        .update({ rating: expectedRating })
        .eq("id", profile.id);
    })
  );
}
