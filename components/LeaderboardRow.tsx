import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GhostBadge } from "@/components/GhostBadge";
import { StreakIcons } from "@/components/StreakIcons";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import { Badge } from "@/components/ui/Badge";
import { getAvatarColor, getInitials, cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/actions/ranking";

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
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition active:scale-[0.99]",
        isCurrentUser
          ? "border-l-4 border-l-accent border-accent/30 bg-accent-muted"
          : "border-border-subtle bg-surface-glass"
      )}
    >
      <Link
        href={`/perfil/${entry.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition active:opacity-80"
      >
        <span className={cn("w-6 text-center text-sm font-bold", rankStyle(rank))}>
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
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-white">{entry.full_name}</p>
            {isCurrentUser && <Badge variant="accent">Vos</Badge>}
            {entry.isGhost && <GhostBadge compact />}
          </div>
          <StreakIcons streak={entry.streak} />
        </div>
        <div className="text-right">
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
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
      </Link>
      {entry.playNudge.type === "nudge" && (
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
