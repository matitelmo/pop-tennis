"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatFormat } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { HistoryItem } from "@/lib/actions/history";

type Props = {
  items: HistoryItem[];
};

export function MatchHistoryList({ items }: Props) {
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  if (!items.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">Todavía no hay partidos cargados</p>
        <Link href="/partido" className="mt-4 inline-block">
          <Button>Cargar tu primer partido</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const { match } = item;
          const won = item.team === "winner";
          const scoreStr = match.set_scores
            .map((s) => `${s.p1}-${s.p2}`)
            .join(" · ");
          const vs = item.opponentNames.join(" & ");

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
                ) : (
                  <Badge variant={won ? "accent" : "danger"}>{won ? "Victoria" : "Derrota"}</Badge>
                )}
                <span className="text-xs text-zinc-500">
                  {formatDate(match.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">vs {vs}</p>
              <p className="mt-1 font-mono text-lg text-white">{scoreStr}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{formatFormat(match.format)}</span>
                {item.rating_delta !== null && (
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
              vs {selected.opponentNames.join(" & ")}
            </p>
            <p className="mt-1 font-mono text-xl text-white">
              {selected.match.set_scores.map((s) => `${s.p1}-${s.p2}`).join(" · ")}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {formatFormat(selected.match.format)} · {formatDate(selected.match.created_at)}
            </p>
            {selected.isPending && (
              <p className="mt-3 text-sm text-amber-400">
                Esperando confirmación del rival (24h)
              </p>
            )}
            {selected.rating_delta !== null && (
              <p
                className={`mt-3 text-lg font-black ${
                  selected.rating_delta >= 0 ? "text-accent" : "text-danger"
                }`}
              >
                {selected.rating_delta >= 0 ? "+" : ""}
                {selected.rating_delta} pts
              </p>
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
