"use client";

import Link from "next/link";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { WeeklyDashboard } from "@/components/WeeklyDashboard";
import { WeeklyMatchCard } from "@/components/WeeklyMatchCard";
import { WeeklyOptInToggle } from "@/components/WeeklyOptInToggle";
import type { WeeklyMatchAssignment } from "@/lib/actions/weekly-match";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ActivityItem } from "@/lib/actions/activity";
import type { PendingMatch } from "@/lib/actions/match";
import type { Profile } from "@/types/database";
import type { CommunitySettings } from "@/lib/community/settings";
import { communityPath } from "@/lib/community/paths";

type Props = {
  communitySlug: string;
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
  weeklyOptIn: boolean;
  canUsePaidFeatures: boolean;
  isLoggedIn: boolean;
};

export function RankingSidebar({
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
}: Props) {
  const activityPreview = activity.slice(0, 5);

  if (!isLoggedIn) return null;

  return (
    <aside className="space-y-6">
      <PendingMatchesBanner
        matches={pending}
        profileNames={profileNames}
        currentUserId={currentUserId!}
      />

      <WeeklyOptInToggle
        optedIn={weeklyOptIn}
        canOptIn={canUsePaidFeatures}
        communitySlug={communitySlug}
        showOptIn={settings.weekly_rival_mode === "opt_in"}
      />

      <WeeklyDashboard
        totalMatches={weekly.totalMatches}
        totalPlayers={weekly.totalPlayers}
        playedThisWeek={weekly.playedThisWeek}
        notPlayed={weekly.notPlayed}
        userPlayedThisWeek={weekly.userPlayedThisWeek}
      />

      {!weekly.userPlayedThisWeek && canUsePaidFeatures && (
        <Card variant="interactive">
          <p className="text-sm font-bold text-white">¿Armamos un partido?</p>
          <p className="mt-1 text-caption">Meta: 1 partido por semana.</p>
          <Link href={communityPath(communitySlug, "partido")} className="mt-3 block">
            <Button className="w-full" size="md">
              Cargar partido
            </Button>
          </Link>
        </Card>
      )}

      {weeklyOptIn && (
        <WeeklyMatchCard assignment={weeklyMatch} communitySlug={communitySlug} />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
            Actividad reciente
          </h2>
          {activity.length > 0 && (
            <Link
              href={communityPath(communitySlug, "historial")}
              className="text-xs font-bold text-accent"
            >
              Ver todo →
            </Link>
          )}
        </div>
        {activityPreview.length === 0 ? (
          <Card>
            <p className="text-center text-caption">Todavía no hay actividad en la liga.</p>
            {canUsePaidFeatures && (
              <Link href={communityPath(communitySlug, "partido")} className="mt-3 block">
                <Button variant="secondary" className="w-full" size="sm">
                  Cargar partido
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <ActivityFeed items={activityPreview} showHeader={false} />
        )}
      </section>
    </aside>
  );
}
