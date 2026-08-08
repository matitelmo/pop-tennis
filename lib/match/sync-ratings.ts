"use server";

import { createServiceClient } from "@/lib/supabase/admin";

export async function syncProfileRatings(): Promise<void> {
  const admin = createServiceClient();

  const [{ data: profiles }, { data: confirmedParts }, { data: pendingMatches }] =
    await Promise.all([
      admin.from("profiles").select("id, base_rating"),
      admin.from("match_participants").select("user_id, rating_delta, matches!inner(status)").eq(
        "matches.status",
        "confirmed"
      ),
      admin
        .from("matches")
        .select("team1_ids, team2_ids, rating_changes")
        .in("status", ["pending", "counter_proposed"]),
    ]);

  const confirmedSum = new Map<string, number>();
  for (const row of confirmedParts ?? []) {
    confirmedSum.set(
      row.user_id,
      (confirmedSum.get(row.user_id) ?? 0) + row.rating_delta
    );
  }

  const pendingSum = new Map<string, number>();
  for (const match of pendingMatches ?? []) {
    const changes = (match.rating_changes ?? {}) as Record<string, number>;
    const participantIds = [
      ...((match.team1_ids ?? []) as string[]),
      ...((match.team2_ids ?? []) as string[]),
    ];
    for (const id of participantIds) {
      if (changes[id] === undefined) continue;
      pendingSum.set(id, (pendingSum.get(id) ?? 0) + changes[id]);
    }
  }

  await Promise.all(
    (profiles ?? []).map((profile) => {
      const expectedRating =
        profile.base_rating +
        (confirmedSum.get(profile.id) ?? 0) +
        (pendingSum.get(profile.id) ?? 0);

      return admin
        .from("profiles")
        .update({ rating: expectedRating })
        .eq("id", profile.id);
    })
  );
}
