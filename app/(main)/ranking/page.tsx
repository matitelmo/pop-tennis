import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getWeeklyStats, getRivalSuggestion } from "@/lib/actions/weekly";
import { getActivityFeed } from "@/lib/actions/activity";
import { getPendingMatchesForUser, getAllProfiles } from "@/lib/actions/match";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { HomePageTabs } from "@/components/HomePageTabs";
import { PageSkeleton } from "@/components/PageSkeleton";

async function RankingContent() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const [entries, weekly, activity, pending, profiles, rival] = await Promise.all([
    getLeaderboard(),
    getWeeklyStats(),
    getActivityFeed(),
    getPendingMatchesForUser(profile.id),
    getAllProfiles(),
    getRivalSuggestion(profile.id),
  ]);

  const profileNames = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));

  return (
    <HomePageTabs
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
      rival={rival}
      currentUserId={profile.id}
    />
  );
}

export default function RankingPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Pop Tennis</h1>
        <p className="text-sm text-zinc-400">1 partido por semana — ¿sumás?</p>
      </header>
      <Suspense fallback={<PageSkeleton rows={6} />}>
        <RankingContent />
      </Suspense>
    </div>
  );
}
