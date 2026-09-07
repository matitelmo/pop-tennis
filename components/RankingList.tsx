"use client";

import Link from "next/link";
import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { MonthlyPodium } from "@/components/MonthlyPodium";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { LeaderboardView } from "@/types/database";

type Props = {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  view?: LeaderboardView;
};

type Mode = "historical" | "monthly" | "activity";

const MODE_TABS = [
  { id: "historical", label: "Pts" },
  { id: "monthly", label: "Mes" },
  { id: "activity", label: "Partidos" },
];

export function RankingList({ entries, currentUserId, view = "alltime" }: Props) {
  const [mode, setMode] = useState<Mode>("historical");

  const sorted = [...entries].sort((a, b) => {
    if (view === "quarterly") return b.quarterlyDelta - a.quarterlyDelta;
    if (mode === "monthly") return b.monthlyDelta - a.monthlyDelta;
    if (mode === "activity") {
      if (b.monthlyMatches !== a.monthlyMatches) {
        return b.monthlyMatches - a.monthlyMatches;
      }
      return b.monthlyDelta - a.monthlyDelta;
    }
    return b.rating - a.rating;
  });

  const showQuarterly = view === "quarterly";

  return (
    <>
      {!showQuarterly && (
        <SegmentTabs
          tabs={MODE_TABS}
          activeId={mode}
          onChange={(id) => setMode(id as Mode)}
          className="mb-4"
        />
      )}

      {mode === "monthly" && !showQuarterly && <MonthlyPodium entries={entries} />}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-caption">Todavía no hay jugadores en este ranking</p>
            {currentUserId && (
              <Link href="/partido" className="mt-3 inline-block">
                <Button size="sm">Sé el primero en cargar un partido</Button>
              </Link>
            )}
          </div>
        )}
        {sorted.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            rank={index + 1}
            showMonthlyDelta={mode === "monthly" && !showQuarterly}
            showQuarterlyDelta={showQuarterly}
            showActivity={mode === "activity" && !showQuarterly}
            isCurrentUser={entry.id === currentUserId}
          />
        ))}
      </div>
    </>
  );
}
