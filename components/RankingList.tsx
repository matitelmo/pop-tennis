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

  return (
    <>
      <SegmentTabs
        tabs={MODE_TABS}
        activeId={mode}
        onChange={(id) => setMode(id as Mode)}
        className="mb-4"
      />

      {mode === "monthly" && <MonthlyPodium entries={entries} />}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-caption">Todavía no hay jugadores en el ranking</p>
            <Link href="/partido" className="mt-3 inline-block">
              <Button size="sm">Sé el primero en cargar un partido</Button>
            </Link>
          </div>
        )}
        {sorted.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={index + 1}
            showMonthlyDelta={mode === "monthly"}
            showActivity={mode === "activity"}
            isCurrentUser={entry.id === currentUserId}
          />
        ))}
      </div>
    </>
  );
}
