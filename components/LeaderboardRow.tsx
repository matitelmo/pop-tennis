import { ChevronRight } from "lucide-react";
import { GhostBadge } from "@/components/GhostBadge";
import { StreakIcons } from "@/components/StreakIcons";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import { Badge } from "@/components/ui/Badge";
import { getAvatarColor, getInitials, cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import Link from "next/link";

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  showMonthlyDelta?: boolean;
  showActivity?: boolean;
  isCurrentUser?: boolean;
};

function rankStyle(rank: number): string {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-orange-400";
  return "text-zinc-500";
}

export function LeaderboardRow({
  entry,
  rank,
  showMonthlyDelta,
  showActivity,
  isCurrentUser,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3 py-3 transition active:scale-[0.99] sm:gap-3 sm:px-4",
        isCurrentUser
          ? "border-accent/40 bg-accent-muted ring-1 ring-accent/20"
          : entry.isUnclaimed
            ? "border-border-subtle bg-surface-glass/50 opacity-90"
            : "border-border-subtle bg-surface-glass"
      )}
    >
      <Link
        href={`/perfil/${entry.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
      >
        <span className={cn("w-6 shrink-0 text-center text-sm font-bold", rankStyle(rank))}>
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
            <p className="max-w-[9rem] truncate font-semibold text-white sm:max-w-none">
              {entry.full_name}
            </p>
            {isCurrentUser && <Badge variant="accent">Vos</Badge>}
            {entry.isUnclaimed && (
              <Badge variant="default" title="Todavía no se registró en la app">
                Sin reclamar
              </Badge>
            )}
            {entry.isGhost && <GhostBadge compact />}
          </div>
          {!entry.isUnclaimed && (
            <div className="mt-1">
              <StreakIcons streak={entry.streak} />
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          {showMonthlyDelta ? (
            <p
              className={cn(
                "text-lg font-bold",
                entry.monthlyDelta >= 0 ? "text-success" : "text-danger"
              )}
            >
              {entry.monthlyDelta >= 0 ? "+" : ""}
              {entry.monthlyDelta}
            </p>
          ) : showActivity ? (
            <p className="text-lg font-bold text-sky-400">{entry.monthlyMatches}</p>
          ) : (
            <p className="text-lg font-bold text-accent">{entry.rating}</p>
          )}
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            {showMonthlyDelta ? "mes" : showActivity ? "partidos" : "pts"}
          </p>
        </div>
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
      {!entry.isUnclaimed && entry.playNudge.type === "nudge" && (
        <div className="shrink-0">
          <PlayNudgeChip
            id={entry.id}
            name={entry.full_name}
            variant="nudge"
            daysInactive={entry.playNudge.days}
            showChallenge
          />
        </div>
      )}
    </div>
  );
}
