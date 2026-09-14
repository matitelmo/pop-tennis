import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AvailabilityFinder } from "@/components/AvailabilityFinder";
import { PendingChallengesBanner } from "@/components/PendingChallengesBanner";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getIncomingChallenges } from "@/lib/actions/challenges-inbox";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { communityPath } from "@/lib/community/paths";
import { t } from "@/lib/i18n/messages";
import { hasActiveSubscription } from "@/lib/subscription";
import type { Availability } from "@/types/database";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function FindPlayersPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  if (!community.settings.player_finder) {
    redirect(communityPath(communitySlug, "ranking"));
  }

  const locale = getCommunityLocale(communitySlug);
  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) redirect("/communities");

  const canChallenge =
    !community.settings.requires_subscription || hasActiveSubscription(member);

  const [incomingChallenges] = await Promise.all([getIncomingChallenges(communitySlug)]);

  const availability = member.availability as Availability | null;
  const hasAvailability =
    availability != null &&
    Object.values(availability).some((blocks) => Array.isArray(blocks) && blocks.length > 0);

  return (
    <div>
      <AppHeader
        title={t(locale, "findPlayersTitle")}
        subtitle={t(locale, "findPlayersSubtitle")}
      />
      <div className="app-page">
        <PendingChallengesBanner challenges={incomingChallenges} communitySlug={communitySlug} />
        <AvailabilityFinder
          communitySlug={communitySlug}
          hasAvailability={hasAvailability}
          canChallenge={canChallenge}
        />
      </div>
    </div>
  );
}
