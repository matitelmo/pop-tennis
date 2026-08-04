"use client";

import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { MonthlyPodium } from "@/components/MonthlyPodium";
import type { LeaderboardEntry } from "@/lib/actions/ranking";

type Props = {
  entries: LeaderboardEntry[];
  currentUserId?: string;
};

type Mode = "historical" | "monthly" | "activity";

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
      <div className="mb-4 flex rounded-2xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["historical", "Histórico"],
            ["monthly", "Del Mes"],
            ["activity", "Partidos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`min-h-[44px] flex-1 rounded-xl text-xs font-bold transition active:scale-[0.98] ${
              mode === key ? "bg-lime-500 text-black" : "text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "monthly" && <MonthlyPodium entries={entries} />}

      {myEntry && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-lime-400">
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
          <p className="py-8 text-center text-sm text-zinc-500">
            Todavía no hay jugadores en el ranking
          </p>
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
