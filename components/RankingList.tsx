"use client";

import Link from "next/link";
import { useState } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { MonthlyPodium } from "@/components/MonthlyPodium";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { LeaderboardView } from "@/types/database";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { communityPath } from "@/lib/community/paths";

type Props = {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  view?: LeaderboardView;
};

type Mode = "historical" | "monthly" | "activity";

export function RankingList({ entries, currentUserId, view = "alltime" }: Props) {
  const { slug: communitySlug, translate: tr } = useCommunity();
  const modeTabs = [
    { id: "historical", label: tr("pts") },
    { id: "monthly", label: tr("month") },
    { id: "activity", label: tr("matches") },
  ];
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
          tabs={modeTabs}
          activeId={mode}
          onChange={(id) => setMode(id as Mode)}
          className="mb-4"
        />
      )}

      {mode === "monthly" && !showQuarterly && <MonthlyPodium entries={entries} />}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-caption">{tr("noRankingPlayers")}</p>
            {currentUserId && (
              <Link href={communityPath(communitySlug, "partido")} className="mt-3 inline-block">
                <Button size="sm">{tr("beFirstMatch")}</Button>
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
