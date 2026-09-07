import { Suspense } from "react";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getWeeklyStats } from "@/lib/actions/weekly";
import { getWeeklyMatchForUser } from "@/lib/actions/weekly-match";
import { getActivityFeed } from "@/lib/actions/activity";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { getCurrentUserProfile, updateLastSeenRank } from "@/lib/actions/auth";
import { getInAppNotifications } from "@/lib/notifications/in-app";
import { getPlayersWithSimilarAvailability } from "@/lib/actions/availability";
import { hasActiveSubscription } from "@/lib/subscription";
import { AppHeader } from "@/components/AppHeader";
import { RankingHome } from "@/components/RankingHome";
import { PageSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

async function RankingContent() {
  const profile = await getCurrentUserProfile();
  const entries = await getLeaderboard();

  if (!profile) {
    return (
      <RankingHome
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
      />
    );
  }

  const canUsePaidFeatures = hasActiveSubscription(profile);

  const [weekly, activity, pending, profiles, weeklyMatch, similarPlayers] =
    await Promise.all([
      getWeeklyStats(),
      getActivityFeed(),
      getPendingMatchesForUser(profile.id),
      getAllProfiles(),
      canUsePaidFeatures && profile.weekly_opt_in
        ? getWeeklyMatchForUser(profile.id)
        : Promise.resolve(null),
      canUsePaidFeatures ? getPlayersWithSimilarAvailability() : Promise.resolve([]),
    ]);

  const profileNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;
  const notifications = await getInAppNotifications(profile, rank, entries);
  if (rank > 0) await updateLastSeenRank(profile.id, rank);

  return (
    <RankingHome
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
      weeklyOptIn={profile.weekly_opt_in}
      canUsePaidFeatures={canUsePaidFeatures}
      similarPlayers={similarPlayers}
      isLoggedIn
    />
  );
}

export default function RankingPage() {
  return (
    <div className="overscroll-none">
      <AppHeader
        title="Venice Pop Tennis"
        subtitle="Fence — ranking oficial"
      />
      <Suspense fallback={<PageSkeleton rows={6} />}>
        <RankingContent />
      </Suspense>
    </div>
  );
}
