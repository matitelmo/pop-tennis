"use client";

import Link from "next/link";
import { useState } from "react";
import { PendingMatchesBanner } from "@/components/PendingMatchesBanner";
import { WeeklyDashboard } from "@/components/WeeklyDashboard";
import { RivalOfTheWeek } from "@/components/RivalOfTheWeek";
import { RankingList } from "@/components/RankingList";
import { ActivityFeed } from "@/components/ActivityFeed";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { ActivityItem } from "@/lib/actions/activity";
import type { PendingMatch } from "@/lib/actions/match";
import type { Profile } from "@/types/database";

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
  rival: { profile: Profile; eloDiff: number } | null;
  currentUserId: string;
};

type Tab = "resumen" | "ranking" | "actividad";

export function HomePageTabs({
  entries,
  weekly,
  activity,
  pending,
  profileNames,
  rival,
  currentUserId,
}: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const actionableCount = pending.filter(
    (m) => m.role === "needs_confirm" || m.role === "needs_accept_counter"
  ).length;

  return (
    <>
      {actionableCount > 0 && tab !== "resumen" && (
        <button
          type="button"
          onClick={() => setTab("resumen")}
          className="mb-4 flex w-full min-h-[44px] items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 text-sm active:scale-[0.99]"
        >
          <span className="font-medium text-amber-400">
            {actionableCount} partido{actionableCount > 1 ? "s" : ""} por confirmar
          </span>
          <span className="text-xs text-amber-300">Ver →</span>
        </button>
      )}

      <div className="sticky top-0 z-10 mb-4 flex rounded-2xl border border-white/10 bg-[#0a0e14]/95 p-1 backdrop-blur-lg">
        {(
          [
            ["resumen", "Resumen"],
            ["ranking", "Ranking"],
            ["actividad", "Actividad"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-[44px] flex-1 rounded-xl text-xs font-bold transition active:scale-[0.98] ${
              tab === key ? "bg-lime-500 text-black" : "text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="space-y-0">
          <PendingMatchesBanner matches={pending} profileNames={profileNames} />
          <WeeklyDashboard
            totalMatches={weekly.totalMatches}
            totalPlayers={weekly.totalPlayers}
            playedThisWeek={weekly.playedThisWeek}
            notPlayed={weekly.notPlayed}
            userPlayedThisWeek={weekly.userPlayedThisWeek}
          />
          {!weekly.userPlayedThisWeek && (
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-white">¿Armamos un partido?</p>
              <p className="mt-1 text-xs text-zinc-400">
                Todavía no jugaste esta semana. Meta: 1 partido por semana.
              </p>
              <Link
                href="/partido"
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl bg-lime-500 font-bold text-black active:scale-[0.98]"
              >
                Cargar partido
              </Link>
            </section>
          )}
          <RivalOfTheWeek rival={rival} />
        </div>
      )}

      {tab === "ranking" && (
        <RankingList entries={entries} currentUserId={currentUserId} />
      )}

      {tab === "actividad" && <ActivityFeed items={activity} showHeader={false} />}
    </>
  );
}
