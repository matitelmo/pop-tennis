import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { MatchWizard } from "@/components/MatchWizard";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { AppHeader } from "@/components/AppHeader";
import { hasActiveSubscription } from "@/lib/subscription";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function PartidoPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const canLog = hasActiveSubscription(profile);

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
        subtitle="Bo3 o Bo5 · confirmación del rival"
      />

      {!canLog && (
        <Card className="mb-6 border-accent/30 p-4">
          <p className="text-sm text-zinc-300">
            Necesitás suscripción activa para registrar partidos oficiales.
          </p>
          <Link href="/subscribe" className="mt-3 block">
            <Button className="w-full">Ver planes</Button>
          </Link>
        </Card>
      )}

      {actionable.length > 0 && (
        <div className="mb-6">
          <PendingMatchesBanner
            matches={pending}
            profileNames={profileNames}
            currentUserId={profile.id}
          />
        </div>
      )}

      {canLog && <MatchWizard currentUserId={profile.id} />}
    </div>
  );
}
