"use client";

import Link from "next/link";
import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { MonthlyPodium } from "@/components/MonthlyPodium";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry } from "@/lib/actions/ranking";

type Props = {
  entries: LeaderboardEntry[];
  currentUserId?: string;
};

type Mode = "historical" | "monthly" | "activity";

const MODE_TABS = [
  { id: "historical", label: "Histórico" },
  { id: "monthly", label: "Del Mes" },
  { id: "activity", label: "Partidos" },
];

export function RankingList({ entries, currentUserId }: Props) {
  const [mode, setMode] = useState<Mode>("historical");

  const sorted = [...entries].sort((a, b) => {
    if (mode === "monthly") return b.monthlyDelta - a.monthlyDelta;
    if (mode === "activity") {
      if (b.monthlyMatches !== a.monthlyMatches) {
        return b.monthlyMatches - a.monthlyMatches;
      }
      return b.monthlyDelta - a.monthlyDelta;
    }
    return b.rating - a.rating;
  });

  const myIndex = currentUserId
    ? sorted.findIndex((e) => e.id === currentUserId)
    : -1;
  const myEntry = myIndex >= 0 ? sorted[myIndex] : undefined;
  const others = currentUserId
    ? sorted.filter((e) => e.id !== currentUserId)
    : sorted;

  return (
    <>
      <SegmentTabs
        tabs={MODE_TABS}
        activeId={mode}
        onChange={(id) => setMode(id as Mode)}
        className="mb-4"
      />

      {mode === "monthly" && <MonthlyPodium entries={entries} />}

      {myEntry && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent">
            Tu posición
          </p>
          <LeaderboardRow
            entry={myEntry}
            rank={myIndex + 1}
            showMonthlyDelta={mode === "monthly"}
            showActivity={mode === "activity"}
            isCurrentUser
          />
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-caption">Todavía no hay jugadores en el ranking</p>
            <Link href="/partido" className="mt-3 inline-block">
              <Button size="sm">Sé el primero en cargar un partido</Button>
            </Link>
          </div>
        )}
        {others.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={sorted.indexOf(entry) + 1}
            showMonthlyDelta={mode === "monthly"}
            showActivity={mode === "activity"}
          />
        ))}
      </div>
    </>
  );
}
