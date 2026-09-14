import { SubscribeCheckout } from "@/components/SubscribeCheckout";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { communityPath } from "@/lib/community/paths";
import { t } from "@/lib/i18n/messages";
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

  const locale = getCommunityLocale(communitySlug);

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
      <AppHeader title={t(locale, "subscription")} subtitle={community.name} />
      {query.success && (
        <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {t(locale, "paymentReceived")}
        </p>
      )}
      {query.canceled && (
        <p className="mb-4 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          {t(locale, "paymentCanceled")}
        </p>
      )}
      <SubscribeCheckout communitySlug={communitySlug} />
      <Link
        href={communityPath(communitySlug, "ranking")}
        className="mt-6 block text-center text-sm text-zinc-500"
      >
        {t(locale, "backToRanking")}
      </Link>
    </div>
  );
}
