import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getWeeklyStats } from "@/lib/actions/weekly";
import { getWeeklyMatchForUser } from "@/lib/actions/weekly-match";
import { getActivityFeed } from "@/lib/actions/activity";
import { getPendingMatchesForUser, getCommunityProfiles } from "@/lib/actions/match";
import { getCurrentUserProfile, updateLastSeenRank } from "@/lib/actions/auth";
import { getCommunityBySlug, getCommunityMember } from "@/lib/community/context";
import { getCommunityLocale } from "@/lib/community/locale";
import { getInAppNotifications } from "@/lib/notifications/in-app";
import { t } from "@/lib/i18n/messages";
import { getPlayersWithSimilarAvailability } from "@/lib/actions/availability";
import { getIncomingChallenges } from "@/lib/actions/challenges-inbox";
import { canUseCommunityFeatures } from "@/lib/subscription";
import { AppHeader } from "@/components/AppHeader";
import { RankingHome } from "@/components/RankingHome";
import { PageSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ community: string }>;
};

async function RankingContent({ communitySlug }: { communitySlug: string }) {
  const community = await getCommunityBySlug(communitySlug);
  if (!community) return null;

  const locale = getCommunityLocale(communitySlug);

  const profile = await getCurrentUserProfile();
  const entries = await getLeaderboard({ communitySlug });

  if (!profile) {
    return (
      <RankingHome
        communitySlug={communitySlug}
        communityName={community.name}
        entries={entries}
        weekly={{
          totalMatches: 0,
          totalPlayers: 0,
          playedThisWeek: 0,
          notPlayed: [],
          userPlayedThisWeek: false,
        }}
        activity={[]}
        pending={[]}
        profileNames={Object.fromEntries(entries.map((e) => [e.id, e.full_name]))}
        weeklyMatch={null}
        weeklyOptIn={false}
        canUsePaidFeatures={false}
        similarPlayers={[]}
        isLoggedIn={false}
        settings={community.settings}
      />
    );
  }

  const member = await getCommunityMember(community.id, profile.id);
  const canUsePaidFeatures = canUseCommunityFeatures(community.settings, member);

  const [weekly, activity, pending, profiles, weeklyMatch, similarPlayers, incomingChallenges] =
    await Promise.all([
      getWeeklyStats(communitySlug),
      getActivityFeed(communitySlug, 20, { locale }),
      getPendingMatchesForUser(community.id, profile.id),
      getCommunityProfiles(community.id),
      canUsePaidFeatures && member?.weekly_opt_in
        ? getWeeklyMatchForUser(communitySlug, profile.id)
        : Promise.resolve(null),
      community.settings.player_finder
        ? getPlayersWithSimilarAvailability(communitySlug)
        : Promise.resolve([]),
      getIncomingChallenges(communitySlug),
    ]);

  const profileNames = Object.fromEntries(
    profiles.map((p) => [p.id as string, p.full_name as string])
  );
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;
  const notifications = await getInAppNotifications(profile, rank, entries, locale);
  if (rank > 0 && member) {
    await updateLastSeenRank(community.id, profile.id, rank);
  }

  return (
    <RankingHome
      communitySlug={communitySlug}
      communityName={community.name}
      entries={entries}
      weekly={{
        totalMatches: weekly.totalMatches,
        totalPlayers: weekly.totalPlayers,
        playedThisWeek: weekly.playedThisWeek,
        notPlayed: weekly.notPlayed,
        userPlayedThisWeek: weekly.playedIds.has(profile.id),
      }}
      activity={activity}
      pending={pending}
      profileNames={profileNames}
      weeklyMatch={weeklyMatch}
      currentUserId={profile.id}
      notifications={notifications}
      weeklyOptIn={member?.weekly_opt_in ?? false}
      canUsePaidFeatures={canUsePaidFeatures}
      similarPlayers={similarPlayers}
      incomingChallenges={incomingChallenges}
      isLoggedIn
      settings={community.settings}
    />
  );
}

export default async function RankingPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const locale = getCommunityLocale(communitySlug);
  const subtitle =
    locale === "en"
      ? t(locale, "officialLeague")
      : communitySlug === "wild-on"
        ? t("es", "officialRanking")
        : community.settings.requires_subscription
          ? t("es", "officialLeague")
          : t("es", "navRanking");

  return (
    <div className="overscroll-none">
      <AppHeader title={community.name} subtitle={subtitle} />
      <Suspense fallback={<PageSkeleton rows={6} />}>
        <RankingContent communitySlug={communitySlug} />
      </Suspense>
    </div>
  );
}
