"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatFormat } from "@/lib/utils";
import { formatSetScoresLine, formatTeamName } from "@/lib/match/score-display";
import { CONFIRMATION_HOURS } from "@/lib/constants";
import { MatchScoreBoard } from "@/components/MatchScoreBoard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { HistoryItem } from "@/lib/actions/history";

type Props = {
  items: HistoryItem[];
  profileNames: Record<string, string>;
  currentUserId: string;
  variant?: "personal" | "group";
  emptyMessage?: string;
  showEmptyAction?: boolean;
};

export function MatchHistoryList({
  items,
  profileNames,
  currentUserId,
  variant = "personal",
  emptyMessage = "Todavía no hay partidos cargados",
  showEmptyAction = true,
}: Props) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const isGroup = variant === "group";

  if (!items.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">{emptyMessage}</p>
        {showEmptyAction && (
          <Link href="/partido" className="mt-4 inline-block">
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

          return (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full rounded-2xl border border-border-subtle bg-surface-glass p-4 text-left transition active:scale-[0.99] hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center justify-between">
                {item.isPending ? (
                  <Badge variant="warning">Pendiente confirmación</Badge>
                ) : isGroup ? (
                  <Badge variant="default">Confirmado</Badge>
                ) : (
                  <Badge variant={won ? "accent" : "danger"}>{won ? "Victoria" : "Derrota"}</Badge>
                )}
                <span className="text-xs text-zinc-500">
                  {formatDate(match.created_at)}
                </span>
              </div>
              <p className={`mt-2 text-sm text-zinc-300 ${isGroup ? "font-medium text-white" : ""}`}>
                {title}
              </p>
              <p className="mt-1 font-mono text-lg text-white">{scoreStr}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {team1Name} (izq) · {team2Name} (der)
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{formatFormat(match.format)}</span>
                {!isGroup && item.rating_delta !== null && (
                  <span
                    className={`font-bold ${
                      item.rating_delta >= 0 ? "text-accent" : "text-danger"
                    }`}
                  >
                    {item.rating_delta >= 0 ? "+" : ""}
                    {item.rating_delta} pts
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <Card
            variant="elevated"
            className="w-full max-w-md animate-slide-up-in rounded-3xl p-6"
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
            {selected.isPending && (
              <p className="mt-3 text-sm text-amber-400">
                Esperando confirmación del rival ({CONFIRMATION_HOURS}h)
              </p>
            )}
            {!isGroup && selected.rating_delta !== null && (
              <p
                className={`mt-3 text-lg font-black ${
                  selected.rating_delta >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {selected.rating_delta >= 0 ? "+" : ""}
                {selected.rating_delta} pts
              </p>
            )}
            {isGroup && selected.match.rating_changes && (
              <div className="mt-3 space-y-1 text-sm">
                {Object.entries(selected.match.rating_changes as Record<string, number>).map(
                  ([id, delta]) => (
                    <div key={id} className="flex justify-between text-zinc-300">
                      <span>{profileNames[id] ?? "Jugador"}</span>
                      <span className={delta >= 0 ? "text-accent" : "text-danger"}>
                        {delta >= 0 ? "+" : ""}
                        {delta} pts
                      </span>
                    </div>
                  )
                )}
              </div>
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
