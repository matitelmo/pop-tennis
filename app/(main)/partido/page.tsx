import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { MatchWizard } from "@/components/MatchWizard";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { AppHeader } from "@/components/AppHeader";

export default async function PartidoPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const [pending, profiles] = await Promise.all([
    getPendingMatchesForUser(profile.id),
    getAllProfiles(),
  ]);
  const profileNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
  const actionable = pending.filter(
    (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
  );

  return (
    <div>
      <AppHeader
        title="Cargar Partido"
        subtitle="Registrá el resultado y mirá el impacto en pts"
      />

      {actionable.length > 0 && (
        <div className="mb-6">
          <PendingMatchesBanner
            matches={pending}
            profileNames={profileNames}
            currentUserId={profile.id}
          />
        </div>
      )}

      <MatchWizard currentUserId={profile.id} />
    </div>
  );
}
