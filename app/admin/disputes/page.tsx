import { getDisputedMatches } from "@/lib/actions/match";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminDisputesList } from "@/components/AdminDisputesList";

export default async function AdminDisputesPage() {
  const matches = await getDisputedMatches();
  const admin = createServiceClient();
  const allIds = matches.flatMap((m) => [
    ...((m.team1_ids as string[]) ?? []),
    ...((m.team2_ids as string[]) ?? []),
    m.submitted_by,
  ]);
  const [{ data: profiles }, { data: communities }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(new Set(allIds.filter(Boolean)))),
    admin.from("communities").select("id, slug"),
  ]);

  const profileNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const communitySlugs = Object.fromEntries((communities ?? []).map((c) => [c.id, c.slug]));

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-white">Disputas</h2>
      <AdminDisputesList
        matches={matches}
        profileNames={profileNames}
        communitySlugs={communitySlugs}
      />
    </div>
  );
}
