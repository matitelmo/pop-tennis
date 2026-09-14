"use client";

import { useState } from "react";
import Link from "next/link";
import { RankingSidebar } from "@/components/ranking/RankingSidebar";
import { RankingList } from "@/components/RankingList";
import { InAppNotifications } from "@/components/InAppNotifications";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { ActivityItem } from "@/lib/actions/activity";
import type { PendingMatch } from "@/lib/actions/match";
import type { Profile } from "@/types/database";
import { PlayerSearchList } from "@/components/PlayerSearchList";
import type { InAppNotification } from "@/lib/notifications/in-app";
import { ChallengeButton } from "@/components/ChallengeButton";
import { PendingChallengesBanner } from "@/components/PendingChallengesBanner";
import type { IncomingChallenge } from "@/lib/actions/challenges-inbox";
import type { WeeklyMatchAssignment } from "@/lib/actions/weekly-match";
import type { CommunitySettings } from "@/lib/community/settings";
import { communityPath } from "@/lib/community/paths";
import { SUBSCRIPTION_GATES_ENABLED, isSubscriptionRequired } from "@/lib/subscription";

type Props = {
  communitySlug: string;
  communityName: string;
  entries: LeaderboardEntry[];
  settings: CommunitySettings;
  weekly: {
    totalMatches: number;
    totalPlayers: number;
    playedThisWeek: number;
    notPlayed: Profile[];
    userPlayedThisWeek: boolean;
  };
  activity: ActivityItem[];
  pending: PendingMatch[];
  profileNames: Record<string, string>;
  weeklyMatch: WeeklyMatchAssignment | null;
  currentUserId?: string;
  notifications?: InAppNotification[];
  weeklyOptIn: boolean;
  canUsePaidFeatures: boolean;
  similarPlayers: (Profile & { overlapDays: number })[];
  incomingChallenges?: IncomingChallenge[];
  isLoggedIn: boolean;
};


export function RankingHome({
  communitySlug,
  communityName,
  entries,
  settings,
  weekly,
  activity,
  pending,
  profileNames,
  weeklyMatch,
  currentUserId,
  notifications = [],
  weeklyOptIn,
  canUsePaidFeatures,
  similarPlayers,
  incomingChallenges = [],
  isLoggedIn,
}: Props) {
  const { translate: tr, showFindPlayers, locale } = useCommunity();
  const genderTabs = [
    { id: "male", label: tr("genderMale") },
    { id: "female", label: tr("genderFemale") },
  ];
  const viewTabs = [
    { id: "alltime", label: locale === "en" ? "All-time" : "Histórico" },
    { id: "quarterly", label: locale === "en" ? "Quarter" : "Trimestre" },
  ];
  const showGenderSplit = settings.leaderboard_gender_split;
  const showQuarterly = settings.leaderboard_quarterly_view;
  const [gender, setGender] = useState<"male" | "female">("male");
  const [view, setView] = useState<"alltime" | "quarterly">("alltime");

  const filtered = showGenderSplit
    ? entries.filter((e) => e.gender === gender || !e.gender)
    : entries;

  const sidebarProps = {
    communitySlug,
    settings,
    weekly,
    activity,
    pending,
    profileNames,
    weeklyMatch,
    currentUserId,
    weeklyOptIn,
    canUsePaidFeatures,
    isLoggedIn,
  };

  return (
    <div className="app-page">
      {!isLoggedIn && (
        <Card className="border-accent/30 bg-accent-muted/20 p-4">
          <p className="text-sm font-bold text-white">{communityName}</p>
          <p className="mt-1 text-caption">{tr("registerFree")}</p>
          <Link href={`/register?community=${communitySlug}`} className="mt-3 block">
            <Button className="w-full" size="sm">
              {tr("createAccount")}
            </Button>
          </Link>
        </Card>
      )}

      {isLoggedIn &&
        SUBSCRIPTION_GATES_ENABLED &&
        isSubscriptionRequired(settings) &&
        !canUsePaidFeatures && (
        <Card className="border-accent/30 p-4">
          <p className="text-sm text-zinc-300">{tr("subscribeBanner")}</p>
          <Link href={communityPath(communitySlug, "subscribe")} className="mt-3 block">
            <Button className="w-full" size="sm">
              {tr("seePlans")}
            </Button>
          </Link>
        </Card>
      )}

      <InAppNotifications notifications={notifications} />

      {isLoggedIn && incomingChallenges.length > 0 && (
        <PendingChallengesBanner
          challenges={incomingChallenges}
          communitySlug={communitySlug}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="order-1 space-y-6 lg:order-1">
          {showGenderSplit && (
            <SegmentTabs
              tabs={genderTabs}
              activeId={gender}
              onChange={(id) => setGender(id as "male" | "female")}
            />
          )}
          {showQuarterly && (
            <SegmentTabs
              tabs={viewTabs}
              activeId={view}
              onChange={(id) => setView(id as "alltime" | "quarterly")}
            />
          )}

          <section>
            <RankingList entries={filtered} currentUserId={currentUserId} view={view} />
          </section>

          {isLoggedIn && similarPlayers.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
                  {tr("similarSchedules")}
                </h2>
                {showFindPlayers && (
                  <Link
                    href={communityPath(communitySlug, "find-players")}
                    className="text-xs font-bold text-accent"
                  >
                    {tr("navFindPlayers")} →
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {similarPlayers.slice(0, 5).map((p) => (
                  <Card key={p.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-semibold text-white">{p.full_name}</p>
                      <p className="text-caption">
                        {p.overlapDays} {tr("daysInCommon")}
                      </p>
                    </div>
                    {canUsePaidFeatures && (
                      <ChallengeButton
                        opponentId={p.id}
                        opponentName={p.full_name}
                        size="sm"
                        communitySlug={communitySlug}
                      />
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {isLoggedIn && (
            <PlayerSearchList
              players={entries.map((e) => ({ id: e.id, full_name: e.full_name }))}
              excludeId={currentUserId}
              title={tr("viewProfileOf")}
              canChallenge={canUsePaidFeatures}
              communitySlug={communitySlug}
            />
          )}
        </div>

        <div className="order-2 lg:order-2 lg:sticky lg:top-6">
          <RankingSidebar {...sidebarProps} />
        </div>
      </div>
    </div>
  );
}
