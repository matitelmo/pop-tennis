import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GhostBadge } from "@/components/GhostBadge";
import { StreakIcons } from "@/components/StreakIcons";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import { getAvatarColor, getInitials } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/actions/ranking";

type Props = {
  entry: LeaderboardEntry;
  rank: number;
  showMonthlyDelta?: boolean;
  showActivity?: boolean;
  isCurrentUser?: boolean;
};

export function LeaderboardRow({
  entry,
  rank,
  showMonthlyDelta,
  showActivity,
  isCurrentUser,
}: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        isCurrentUser
          ? "border-lime-400/30 bg-lime-400/5"
          : "border-white/5 bg-white/5"
      }`}
    >
      <Link
        href={`/perfil/${entry.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition active:opacity-80"
      >
        <span className="w-6 text-center text-sm font-bold text-zinc-500">
          {rank}
        </span>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(entry.id)}`}
        >
          {getInitials(entry.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-white">
              {entry.full_name}
              {isCurrentUser && (
                <span className="ml-1 text-[10px] text-lime-400">(vos)</span>
              )}
            </p>
            {entry.isGhost && <GhostBadge />}
          </div>
          <StreakIcons streak={entry.streak} />
        </div>
        <div className="text-right">
          {showMonthlyDelta ? (
            <p
              className={`text-lg font-bold ${
                entry.monthlyDelta >= 0 ? "text-lime-400" : "text-red-400"
              }`}
            >
              {entry.monthlyDelta >= 0 ? "+" : ""}
              {entry.monthlyDelta}
            </p>
          ) : showActivity ? (
            <p className="text-lg font-bold text-sky-400">{entry.monthlyMatches}</p>
          ) : (
            <p className="text-lg font-bold text-lime-400">{entry.rating}</p>
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
