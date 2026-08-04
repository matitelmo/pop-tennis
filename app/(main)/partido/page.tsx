import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { MatchWizard } from "@/components/MatchWizard";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";

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
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Cargar Partido</h1>
        <p className="text-sm text-zinc-400">Registrá el resultado y mirá el impacto en pts</p>
      </header>

      {actionable.length > 0 && (
        <div className="mb-6">
          <PendingMatchesBanner matches={pending} profileNames={profileNames} />
        </div>
      )}

      <MatchWizard currentUserId={profile.id} />
    </div>
  );
}
