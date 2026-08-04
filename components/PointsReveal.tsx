"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchPointContext } from "@/components/MatchPointContext";
import { buildMatchShareText, shareViaWhatsApp } from "@/lib/share";
import type { MatchPointSummary } from "@/lib/match-labels";

type Props = {
  deltas: Record<string, number>;
  names: Record<string, string>;
  winnerIds: string[];
  loserIds: string[];
  scoreStr: string;
  pending?: boolean;
  summary?: MatchPointSummary;
  onClose: () => void;
};

export function PointsReveal({
  deltas,
  names,
  winnerIds,
  loserIds,
  scoreStr,
  pending = false,
  summary,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const winnerNames = winnerIds.map((id) => names[id] ?? "?");
  const loserNames = loserIds.map((id) => names[id] ?? "?");

  function handleShare() {
    const text = buildMatchShareText({
      winnerNames,
      loserNames,
      scoreStr,
      deltas: pending ? undefined : deltas,
      pending,
    });
    shareViaWhatsApp(text);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm transform rounded-3xl border border-lime-400/30 bg-gradient-to-b from-[#1a2332] to-[#0f1419] p-6 shadow-2xl transition-all duration-500 ${
          visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-center text-2xl font-black text-lime-400">
          {pending ? "Resultado enviado" : "¡Partido confirmado!"}
        </h2>
        {pending && (
          <p className="mb-4 text-center text-sm text-zinc-400">
            Esperando confirmación del rival (24h). Si no responde, se valida solo.
          </p>
        )}
        <p className="mb-4 text-center font-mono text-sm text-zinc-400">{scoreStr}</p>
        <div className="space-y-3">
          {Object.entries(deltas).map(([id, delta]) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <span className="font-medium text-white">{names[id]}</span>
              <span
                className={`text-xl font-black ${
                  pending
                    ? "text-zinc-400"
                    : delta >= 0
                      ? "text-lime-400"
                      : "text-red-400"
                }`}
              >
                {pending ? "~" : delta >= 0 ? "+" : ""}
                {delta}
              </span>
            </div>
          ))}
        </div>
        {summary && <MatchPointContext summary={summary} />}
        <Link
          href="/reglas#calculo"
          className="mt-4 block text-center text-sm text-zinc-500 underline"
        >
          Más sobre el ranking
        </Link>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleShare}
            className="min-h-[44px] flex-1 rounded-xl border border-lime-400/30 text-sm font-bold text-lime-400"
          >
            Compartir WhatsApp
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] flex-1 rounded-xl bg-lime-500 font-bold text-black"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
