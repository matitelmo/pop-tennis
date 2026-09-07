"use client";

import { useState } from "react";
import Link from "next/link";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { WeeklyDashboard } from "@/components/WeeklyDashboard";
import { WeeklyMatchCard } from "@/components/WeeklyMatchCard";
import { WeeklyOptInToggle } from "@/components/WeeklyOptInToggle";
import type { WeeklyMatchAssignment } from "@/lib/actions/weekly-match";
import { RankingList } from "@/components/RankingList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { InAppNotifications } from "@/components/InAppNotifications";
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

import type { CommunitySettings } from "@/lib/community/settings";
import { communityPath } from "@/lib/community/paths";

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
  isLoggedIn: boolean;
};

const GENDER_TABS = [
  { id: "male", label: "Hombres" },
  { id: "female", label: "Mujeres" },
];

const VIEW_TABS = [
  { id: "alltime", label: "Histórico" },
  { id: "quarterly", label: "Trimestre" },
];

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
  isLoggedIn,
}: Props) {
  const showGenderSplit = settings.leaderboard_gender_split;
  const showQuarterly = settings.leaderboard_quarterly_view;
  const [gender, setGender] = useState<"male" | "female">("male");
  const [view, setView] = useState<"alltime" | "quarterly">("alltime");

  const filtered = showGenderSplit
    ? entries.filter((e) => e.gender === gender)
    : entries;
  const activityPreview = activity.slice(0, 5);

  return (
    <div className="space-y-6">
      {!isLoggedIn && (
        <Card className="border-accent/30 bg-accent-muted/20 p-4">
          <p className="text-sm font-bold text-white">{communityName}</p>
          <p className="mt-1 text-caption">Registrate gratis para unirte.</p>
          <Link href={`/register?community=${communitySlug}`} className="mt-3 block">
            <Button className="w-full" size="sm">
              Crear cuenta
            </Button>
          </Link>
        </Card>
      )}

      {isLoggedIn && settings.requires_subscription && !canUsePaidFeatures && (
        <Card className="border-accent/30 p-4">
          <p className="text-sm text-zinc-300">
            Suscribite para cargar partidos y desafiar rivales.
          </p>
          <Link href={communityPath(communitySlug, "subscribe")} className="mt-3 block">
            <Button className="w-full" size="sm">
              Ver planes — $10/mo
            </Button>
          </Link>
        </Card>
      )}

      <InAppNotifications notifications={notifications} />

      {isLoggedIn && (
        <PendingMatchesBanner
          matches={pending}
          profileNames={profileNames}
          currentUserId={currentUserId!}
        />
      )}

      {isLoggedIn && (
        <>
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
        </>
      )}

      {showGenderSplit && (
        <SegmentTabs
          tabs={GENDER_TABS}
          activeId={gender}
          onChange={(id) => setGender(id as "male" | "female")}
        />
      )}
      {showQuarterly && (
        <SegmentTabs
          tabs={VIEW_TABS}
          activeId={view}
          onChange={(id) => setView(id as "alltime" | "quarterly")}
          className="mb-2"
        />
      )}

      <section>
        <RankingList
          entries={filtered}
          currentUserId={currentUserId}
          view={view}
        />
      </section>

      {isLoggedIn && similarPlayers.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
            Horarios similares
          </h2>
          <div className="space-y-2">
            {similarPlayers.slice(0, 5).map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-semibold text-white">{p.full_name}</p>
                  <p className="text-caption">{p.overlapDays} días en común</p>
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
          title="Ver perfil de..."
          canChallenge={canUsePaidFeatures}
          communitySlug={communitySlug}
        />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
            Actividad reciente
          </h2>
          {activity.length > 0 && isLoggedIn && (
            <Link href={communityPath(communitySlug, "historial")} className="text-xs font-bold text-accent">
              Ver todo →
            </Link>
          )}
        </div>
        {activityPreview.length === 0 ? (
          <Card>
            <p className="text-center text-caption">
              Todavía no hay actividad en la liga.
            </p>
            {isLoggedIn && canUsePaidFeatures && (
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
    </div>
  );
}
