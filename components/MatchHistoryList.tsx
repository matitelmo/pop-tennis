"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatFormat } from "@/lib/utils";
import { formatSetScoresLine, formatTeamName } from "@/lib/match/score-display";
import { MatchScoreBoard } from "@/components/MatchScoreBoard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  MatchParticipantPoints,
  MatchUserDelta,
} from "@/components/MatchParticipantPoints";
import type { HistoryItem } from "@/lib/actions/history";
import { useCommunitySlug } from "@/hooks/useCommunitySlug";
import { communityPath } from "@/lib/community/paths";

type Props = {
  items: HistoryItem[];
  profileNames: Record<string, string>;
  currentUserId: string;
  variant?: "personal" | "group";
  emptyMessage?: string;
  showEmptyAction?: boolean;
  communitySlug?: string;
};

export function MatchHistoryList({
  items,
  profileNames,
  currentUserId,
  variant = "personal",
  emptyMessage = "Todavía no hay partidos cargados",
  showEmptyAction = true,
  communitySlug: slugProp,
}: Props) {
  const communityFromRoute = useCommunitySlug();
  const communitySlug = slugProp ?? communityFromRoute;
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const isGroup = variant === "group";

  if (!items.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">{emptyMessage}</p>
        {showEmptyAction && (
          <Link href={communityPath(communitySlug, "partido")} className="mt-4 inline-block">
            <Button>Cargar tu primer partido</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const { match } = item;
          const won = item.team === "winner";
          const team1Name = formatTeamName(match.team1_ids ?? [], profileNames);
          const team2Name = formatTeamName(match.team2_ids ?? [], profileNames);
          const scoreStr = formatSetScoresLine(match.set_scores);
          const title = isGroup ? item.headline : `vs ${item.opponentNames.join(" & ")}`;
          const ratingChanges = (match.rating_changes ?? {}) as Record<string, number>;

          return (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full rounded-2xl border border-border-subtle bg-surface-glass p-4 text-left transition active:scale-[0.99] hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex lg:items-center lg:justify-between lg:gap-6 lg:p-5"
            >
              <div className="lg:min-w-0 lg:flex-1">
                <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                  {isGroup ? (
                    <Badge variant="default">Confirmado</Badge>
                  ) : (
                    <Badge variant={won ? "accent" : "danger"}>{won ? "Victoria" : "Derrota"}</Badge>
                  )}
                  <span className="text-xs text-zinc-500 lg:order-first">
                    {formatDate(match.created_at)}
                  </span>
                </div>
                <p className={`mt-2 text-sm text-zinc-300 lg:mt-1 ${isGroup ? "font-medium text-white" : ""}`}>
                  {title}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 lg:hidden">
                  {team1Name} (izq) · {team2Name} (der)
                </p>
              </div>

              <div className="mt-2 lg:mt-0 lg:flex lg:shrink-0 lg:items-center lg:gap-6">
                <p className="font-mono text-lg text-white">{scoreStr}</p>
                <div className="mt-2 flex items-center justify-between text-sm lg:mt-0 lg:flex-col lg:items-end lg:gap-1">
                  <span className="text-zinc-400">{formatFormat(match.format)}</span>
                  {!isGroup && <MatchUserDelta delta={item.rating_delta} />}
                </div>
              </div>

              {isGroup && Object.keys(ratingChanges).length > 0 && (
                <div className="mt-2 lg:col-span-full lg:mt-3 lg:w-full">
                  <MatchParticipantPoints
                    ratingChanges={ratingChanges}
                    profileNames={profileNames}
                    team1Ids={match.team1_ids ?? []}
                    team2Ids={match.team2_ids ?? []}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm lg:items-center"
          onClick={() => setSelected(null)}
        >
          <Card
            variant="elevated"
            className="w-full max-w-md animate-slide-up-in rounded-3xl p-6 lg:max-w-lg lg:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Detalle del partido</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {isGroup ? selected.headline : `vs ${selected.opponentNames.join(" & ")}`}
            </p>
            <div className="mt-3">
              <MatchScoreBoard
                setScores={selected.match.set_scores}
                team1Ids={selected.match.team1_ids ?? []}
                team2Ids={selected.match.team2_ids ?? []}
                profileNames={profileNames}
                currentUserId={currentUserId}
                winningTeam={
                  selected.match.winning_team === 1 || selected.match.winning_team === 2
                    ? selected.match.winning_team
                    : undefined
                }
              />
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {formatFormat(selected.match.format)} · {formatDate(selected.match.created_at)}
            </p>
            {!isGroup && selected.rating_delta !== null && (
              <p
                className={`mt-3 text-lg font-black tabular-nums ${
                  selected.rating_delta >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {selected.rating_delta >= 0 ? "+" : ""}
                {selected.rating_delta} pts
              </p>
            )}
            {isGroup && (
              <MatchParticipantPoints
                ratingChanges={(selected.match.rating_changes ?? {}) as Record<string, number>}
                profileNames={profileNames}
                team1Ids={selected.match.team1_ids ?? []}
                team2Ids={selected.match.team2_ids ?? []}
              />
            )}
            <Button type="button" variant="secondary" onClick={() => setSelected(null)} className="mt-6 w-full">
              Cerrar
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
