import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { logout, getCurrentUserProfile } from "@/lib/actions/auth";
import { getPersonalMatchHistory, getUserBadges } from "@/lib/actions/history";
import { MyRecordSection } from "@/components/MyRecordSection";
import { getRatingHistory } from "@/lib/actions/rating-history";
import { BadgeGrid } from "@/components/BadgeGrid";
import { GhostBadge } from "@/components/GhostBadge";
import { RatingChart } from "@/components/RatingChart";
import { ProfileRating } from "@/components/ProfileRating";
import { StreakIcons } from "@/components/StreakIcons";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getCommunityProfiles } from "@/lib/actions/match";
import { getCommunityBySlug, getCommunityMember, getUserCommunities } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { communityPath } from "@/lib/community/paths";
import { getSkillLabelLocalized, t } from "@/lib/i18n/messages";
import { hasActiveSubscription, subscriptionLabel as subLabel } from "@/lib/subscription";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { ProfileStatsSection } from "@/components/ProfileStatsSection";
import { PlayerSearchList } from "@/components/PlayerSearchList";
import { AvailabilitySection } from "@/components/AvailabilitySection";
import { PhoneNumberSection } from "@/components/PhoneNumberSection";
import { LogOut } from "lucide-react";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function PerfilPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const locale = getCommunityLocale(communitySlug);
  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const member = await getCommunityMember(community.id, profile.id);
  if (!member) redirect("/communities");

  const [badges, ratingHistory, personalHistory, allProfiles, userCommunities] =
    await Promise.all([
      getUserBadges(profile.id),
      getRatingHistory(profile.id),
      getPersonalMatchHistory(profile.id),
      getCommunityProfiles(community.id),
      getUserCommunities(profile.id),
    ]);

  const entries = await getLeaderboard({ communitySlug });
  const myEntry = entries.find((e) => e.id === profile.id);
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;
  const canUsePaidFeatures =
    !community.settings.requires_subscription || hasActiveSubscription(member);

  return (
    <div className="space-y-6">
      <AppHeader
        title={t(locale, "myProfile")}
        subtitle={community.name}
        action={
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="min-w-[44px] px-2">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        }
      />

      {userCommunities.length > 1 && (
        <Card className="p-4">
          <p className="text-sm text-zinc-400">{t(locale, "yourCommunities")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {userCommunities.map((c) => (
              <Link
                key={c.id}
                href={communityPath(c.slug, "ranking")}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  c.slug === communitySlug
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/10 text-zinc-300"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-white ${getAvatarColor(profile.id)}`}
        >
          {getInitials(profile.full_name)}
        </div>
        <h2 className="mt-4 text-title">{profile.full_name}</h2>
        {myEntry?.isGhost && (
          <div className="mt-2 flex justify-center">
            <GhostBadge />
          </div>
        )}
        <p className="text-body">{getSkillLabelLocalized(profile.skill_level, locale)}</p>
        {profile.gender && (
          <p className="text-caption capitalize">
            {profile.gender === "male" ? t(locale, "genderMale") : t(locale, "genderFemale")}
          </p>
        )}
        <ProfileRating rating={member.rating} />
        {community.settings.requires_subscription && (
          <p className="mt-1 text-caption">{subLabel(member.subscription_status)}</p>
        )}
        {rank > 0 && (
          <p className="mt-1 text-caption">
            {t(locale, "rankPosition")}
            {rank}
          </p>
        )}
        {myEntry && (
          <div className="mt-4 flex justify-center">
            <StreakIcons streak={myEntry.streak} />
          </div>
        )}
        {community.settings.requires_subscription && !canUsePaidFeatures && (
          <Link href={communityPath(communitySlug, "subscribe")} className="mt-4 block">
            <Button size="sm" className="w-full">
              {t(locale, "activateSubscription")}
            </Button>
          </Link>
        )}
      </Card>

      {community.settings.player_finder && (
        <>
          <PhoneNumberSection
            initial={profile.phone_number}
            canEdit
            communitySlug={communitySlug}
          />
          <AvailabilitySection
            initial={member.availability}
            canEdit
            communitySlug={communitySlug}
          />
        </>
      )}

      <RatingChart points={ratingHistory} />

      <ProfileStatsSection userId={profile.id} possessive="tuyo" communitySlug={communitySlug} />

      <MyRecordSection
        items={personalHistory.items}
        profileNames={personalHistory.profileNames}
        currentUserId={profile.id}
      />

      {community.settings.show_badges && (
        <div>
          <h3 className="mb-3 font-bold text-white">{t(locale, "medals")}</h3>
          <BadgeGrid unlockedCodes={badges.map((b) => b.badge_code)} />
        </div>
      )}

      <PlayerSearchList
        players={allProfiles.map((p) => ({
          id: p.id as string,
          full_name: p.full_name as string,
        }))}
        excludeId={profile.id}
        title={t(locale, "viewProfileOf")}
        canChallenge={canUsePaidFeatures && community.settings.requires_subscription}
        communitySlug={communitySlug}
      />

      <Link
        href={communityPath(communitySlug, "reglas")}
        className="block text-center text-caption underline"
      >
        {t(locale, "rulesAndRanking")}
      </Link>
    </div>
  );
}
