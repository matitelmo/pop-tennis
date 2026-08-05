import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getWeeklyStats } from "@/lib/actions/weekly";
import { getWeeklyMatchForUser } from "@/lib/actions/weekly-match";
import { getActivityFeed } from "@/lib/actions/activity";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { getCurrentUserProfile, updateLastSeenRank } from "@/lib/actions/auth";
import { getInAppNotifications } from "@/lib/notifications/in-app";
import { AppHeader } from "@/components/AppHeader";
import { RankingHome } from "@/components/RankingHome";
import { PageSkeleton } from "@/components/PageSkeleton";

async function RankingContent() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const [entries, weekly, activity, pending, profiles, weeklyMatch] = await Promise.all([
    getLeaderboard(),
    getWeeklyStats(),
    getActivityFeed(),
    getPendingMatchesForUser(profile.id),
    getAllProfiles(),
    getWeeklyMatchForUser(profile.id),
  ]);

  const profileNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;
  const notifications = await getInAppNotifications(profile, rank, entries);
  await updateLastSeenRank(profile.id, rank);

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
    />
  );
}

export default function RankingPage() {
  return (
    <div className="overscroll-none">
      <AppHeader
        title="Wild On Pop Tennis"
        subtitle="1 partido por semana — ¿sumás?"
      />
      <Suspense fallback={<PageSkeleton rows={6} />}>
        <RankingContent />
      </Suspense>
    </div>
  );
}
