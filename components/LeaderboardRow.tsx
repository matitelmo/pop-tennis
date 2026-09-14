"use client";

import { ChevronRight, MoreHorizontal } from "lucide-react";
import { GhostBadge } from "@/components/GhostBadge";
import { StreakIcons } from "@/components/StreakIcons";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import { Badge } from "@/components/ui/Badge";
import { getAvatarColor, getInitials, cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import Link from "next/link";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { communityPath } from "@/lib/community/paths";
import { useState } from "react";

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  showMonthlyDelta?: boolean;
  showQuarterlyDelta?: boolean;
  showActivity?: boolean;
  isCurrentUser?: boolean;
};

function rankStyle(rank: number): string {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-orange-400";
  return "text-zinc-500";
}

function PointsCell({
  entry,
  showQuarterlyDelta,
  showMonthlyDelta,
  showActivity,
  tr,
}: {
  entry: LeaderboardEntry;
  showQuarterlyDelta?: boolean;
  showMonthlyDelta?: boolean;
  showActivity?: boolean;
  tr: (key: import("@/lib/i18n/messages").MessageKey) => string;
}) {
  const value = showQuarterlyDelta
    ? entry.quarterlyDelta
    : showMonthlyDelta
      ? entry.monthlyDelta
      : showActivity
        ? entry.monthlyMatches
        : entry.rating;

  const label = showQuarterlyDelta
    ? tr("quarter")
    : showMonthlyDelta
      ? tr("month")
      : showActivity
        ? tr("matches")
        : tr("points");

  const colorClass =
    showQuarterlyDelta || showMonthlyDelta
      ? value >= 0
        ? "text-success"
        : "text-danger"
      : showActivity
        ? "text-sky-400"
        : "text-accent";

  return (
    <div className="shrink-0 text-right lg:w-16">
      <p className={cn("text-lg font-bold tabular-nums", colorClass)}>
        {(showQuarterlyDelta || showMonthlyDelta) && value >= 0 ? "+" : ""}
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

export function LeaderboardRow({
  entry,
  rank,
  showMonthlyDelta,
  showQuarterlyDelta,
  showActivity,
  isCurrentUser,
}: Props) {
  const { slug: communitySlug, translate: tr, showBadges } = useCommunity();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasNudge = entry.playNudge.type === "nudge";

  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 transition active:scale-[0.99] sm:px-4",
        isCurrentUser
          ? "border-accent/40 bg-accent-muted ring-1 ring-accent/20"
          : "border-border-subtle bg-surface-glass"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 lg:grid lg:grid-cols-[2rem_1fr_5rem_4rem] lg:items-center lg:gap-4">
        <Link
          href={communityPath(communitySlug, `perfil/${entry.id}`)}
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:col-span-3 lg:contents"
        >
          <span
            className={cn(
              "w-6 shrink-0 text-center text-sm font-bold lg:w-8",
              rankStyle(rank)
            )}
          >
            {rank}
          </span>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
              getAvatarColor(entry.id)
            )}
          >
            {getInitials(entry.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate font-semibold text-white">{entry.full_name}</p>
              {isCurrentUser && <Badge variant="accent">{tr("you")}</Badge>}
              {entry.isUnclaimed && (
                <Badge variant="default" title={tr("unclaimed")}>
                  {tr("unclaimed")}
                </Badge>
              )}
              {entry.isFrozen && <Badge variant="default">{tr("frozen")}</Badge>}
              {showBadges && entry.isGhost && <GhostBadge compact />}
            </div>
            <div className="mt-1 lg:hidden">
              <StreakIcons streak={entry.streak} />
            </div>
          </div>
          <div className="lg:hidden">
            <PointsCell
              entry={entry}
              showQuarterlyDelta={showQuarterlyDelta}
              showMonthlyDelta={showMonthlyDelta}
              showActivity={showActivity}
              tr={tr}
            />
          </div>
        </Link>

        <div className="hidden lg:block">
          <StreakIcons streak={entry.streak} />
        </div>

        <div className="hidden lg:block">
          <PointsCell
            entry={entry}
            showQuarterlyDelta={showQuarterlyDelta}
            showMonthlyDelta={showMonthlyDelta}
            showActivity={showActivity}
            tr={tr}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasNudge && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label={tr("challenge")}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          )}
          <Link
            href={communityPath(communitySlug, `perfil/${entry.id}`)}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center lg:flex"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
        </div>
      </div>

      {(menuOpen || hasNudge) && (
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2",
            !menuOpen && "hidden lg:flex"
          )}
        >
          {hasNudge && (
            <PlayNudgeChip
              id={entry.id}
              name={entry.full_name}
              variant="nudge"
              daysInactive={entry.playNudge.days}
              showChallenge
              canChallenge={!entry.isFrozen}
            />
          )}
        </div>
      )}
    </div>
  );
}
