import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getDisputedMatches } from "@/lib/actions/match";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminDisputesList } from "@/components/AdminDisputesList";
import { AppHeader } from "@/components/AppHeader";
import { communityPath, DEFAULT_COMMUNITY_SLUG } from "@/lib/community/paths";

export default async function AdminDisputesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.id !== process.env.ADMIN_USER_ID) {
    redirect(communityPath(DEFAULT_COMMUNITY_SLUG, "ranking"));
  }

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
    <div className="mx-auto max-w-md px-4 py-6">
      <AppHeader title="Disputas" subtitle="Admin" />
      <AdminDisputesList
        matches={matches}
        profileNames={profileNames}
        communitySlugs={communitySlugs}
      />
    </div>
  );
}
