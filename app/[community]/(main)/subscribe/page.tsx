import { SubscribeCheckout } from "@/components/SubscribeCheckout";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
import { hasActiveSubscription } from "@/lib/subscription";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ community: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
};

export default async function SubscribePage({ params, searchParams }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  if (!community.settings.requires_subscription) {
    redirect(communityPath(communitySlug, "ranking"));
  }

  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) redirect("/communities");

  if (hasActiveSubscription(member)) {
    redirect(communityPath(communitySlug, "partido"));
  }

  const query = await searchParams;

  return (
    <div>
      <AppHeader title="Suscripción" subtitle={community.name} />
      {query.success && (
        <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          ¡Pago recibido! Ya podés cargar partidos.
        </p>
      )}
      {query.canceled && (
        <p className="mb-4 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          Pago cancelado. Podés intentar de nuevo cuando quieras.
        </p>
      )}
      <SubscribeCheckout communitySlug={communitySlug} />
      <Link
        href={communityPath(communitySlug, "ranking")}
        className="mt-6 block text-center text-sm text-zinc-500"
      >
        ← Volver al ranking
      </Link>
    </div>
  );
}
