"use client";

import Link from "next/link";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { WeeklyDashboard } from "@/components/WeeklyDashboard";
import { WeeklyMatchCard } from "@/components/WeeklyMatchCard";
import type { WeeklyMatchAssignment } from "@/lib/actions/weekly-match";
import { RankingList } from "@/components/RankingList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { InAppNotifications } from "@/components/InAppNotifications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { ActivityItem } from "@/lib/actions/activity";
import type { PendingMatch } from "@/lib/actions/match";
import type { Profile } from "@/types/database";
import type { InAppNotification } from "@/lib/notifications/in-app";

type Props = {
  entries: LeaderboardEntry[];
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
  currentUserId: string;
  notifications?: InAppNotification[];
};

export function RankingHome({
  entries,
  weekly,
  activity,
  pending,
  profileNames,
  weeklyMatch,
  currentUserId,
  notifications = [],
}: Props) {
  const activityPreview = activity.slice(0, 5);

  return (
    <div className="space-y-6">
      <InAppNotifications notifications={notifications} />

      <PendingMatchesBanner
        matches={pending}
        profileNames={profileNames}
        currentUserId={currentUserId}
      />

      <WeeklyDashboard
        totalMatches={weekly.totalMatches}
        totalPlayers={weekly.totalPlayers}
        playedThisWeek={weekly.playedThisWeek}
        notPlayed={weekly.notPlayed}
        userPlayedThisWeek={weekly.userPlayedThisWeek}
      />

      {!weekly.userPlayedThisWeek && (
        <Card variant="interactive">
          <p className="text-sm font-bold text-white">¿Armamos un partido?</p>
          <p className="mt-1 text-caption">
            Todavía no jugaste esta semana. Meta: 1 partido por semana.
          </p>
          <Link href="/partido" className="mt-3 block">
            <Button className="w-full" size="md">
              Cargar partido
            </Button>
          </Link>
        </Card>
      )}

      <WeeklyMatchCard assignment={weeklyMatch} />

      <section>
        <RankingList entries={entries} currentUserId={currentUserId} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
            Actividad reciente
          </h2>
          {activity.length > 0 && (
            <Link href="/historial" className="text-xs font-bold text-accent">
              Ver todo →
            </Link>
          )}
        </div>
        {activityPreview.length === 0 ? (
          <Card>
            <p className="text-center text-caption">
              Todavía no pasa nada en la banda. Cargá el primer partido.
            </p>
            <Link href="/partido" className="mt-3 block">
              <Button variant="secondary" className="w-full" size="sm">
                Cargar partido
              </Button>
            </Link>
          </Card>
        ) : (
          <ActivityFeed items={activityPreview} showHeader={false} />
        )}
      </section>
    </div>
  );
}
