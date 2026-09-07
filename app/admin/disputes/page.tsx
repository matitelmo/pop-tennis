import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getDisputedMatches } from "@/lib/actions/match";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminDisputesList } from "@/components/AdminDisputesList";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminDisputesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.id !== process.env.ADMIN_USER_ID) {
    redirect("/ranking");
  }

  const matches = await getDisputedMatches();
  const admin = createServiceClient();
  const allIds = matches.flatMap((m) => [
    ...((m.team1_ids as string[]) ?? []),
    ...((m.team2_ids as string[]) ?? []),
    m.submitted_by,
  ]);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(new Set(allIds.filter(Boolean))));

  const profileNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <AppHeader title="Disputas" subtitle="Admin — Fence" />
      <AdminDisputesList matches={matches} profileNames={profileNames} />
    </div>
  );
}
