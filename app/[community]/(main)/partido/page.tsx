import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getPendingMatchesForUser, getCommunityProfiles } from "@/lib/actions/match";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
import { MatchWizard } from "@/components/MatchWizard";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { AppHeader } from "@/components/AppHeader";
import { hasActiveSubscription } from "@/lib/subscription";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function PartidoPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) redirect(communityPath(communitySlug, "ranking"));

  const requiresSub = community.settings.requires_subscription;
  const canLog = !requiresSub || hasActiveSubscription(member);
  const isInstant = community.settings.match_confirmation === "instant";

  const [pending, profiles] = await Promise.all([
    getPendingMatchesForUser(community.id, profile.id),
    getCommunityProfiles(community.id),
  ]);
  const profileNames = Object.fromEntries(
    profiles.map((p) => [p.id as string, p.full_name as string])
  );
  const actionable = pending.filter(
    (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
  );

  return (
    <div>
      <AppHeader
        title="Cargar Partido"
        subtitle={
          isInstant
            ? "Resultado instantáneo en el ranking"
            : "Bo3 o Bo5 · confirmación del rival"
        }
      />

      {requiresSub && !canLog && (
        <Card className="mb-6 border-accent/30 p-4">
          <p className="text-sm text-zinc-300">
            Necesitás suscripción activa para registrar partidos oficiales.
          </p>
          <Link href={communityPath(communitySlug, "subscribe")} className="mt-3 block">
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

      {canLog && (
        <MatchWizard
          currentUserId={profile.id}
          communitySlug={communitySlug}
          allowedFormats={community.settings.allowed_formats}
        />
      )}
    </div>
  );
}
