"use client";

import { useState } from "react";
import {
  acceptCounterMatch,
  confirmMatch,
  proposeCounterMatch,
  type PendingMatch,
} from "@/lib/actions/match";
import { ScoreControl } from "@/components/ScoreControl";
import { useToast } from "@/components/ToastProvider";
import { formatFormat } from "@/lib/utils";
import type { SetScore } from "@/types/database";
import { Check, Loader2, X } from "lucide-react";

type Props = {
  match: PendingMatch;
  profileNames: Record<string, string>;
  onDone: () => void;
};

export function PendingMatchCard({ match, profileNames, onDone }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputing, setDisputing] = useState(false);
  const [counterScores, setCounterScores] = useState<SetScore[]>([...match.set_scores]);
  const [counterWinner, setCounterWinner] = useState<1 | 2>(match.winning_team as 1 | 2);

  const scoreStr = match.set_scores.map((s) => `${s.p1}-${s.p2}`).join(" · ");
  const deadline = new Date(match.confirmation_deadline);
  const hoursLeft = Math.max(
    0,
    Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const urgent = hoursLeft <= 6;

  const winnerNames = match.winner_ids.map((id) => profileNames[id] ?? "?").join(" & ");
  const loserNames = match.loser_ids.map((id) => profileNames[id] ?? "?").join(" & ");

  const updateCounterSet = (index: number, side: "p1" | "p2", delta: number) => {
    setCounterScores((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [side]: Math.max(0, Math.min(7, s[side] + delta)) } : s
      )
    );
  };

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const res = await confirmMatch(match.id);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else {
      toast("Partido confirmado — ranking actualizado");
      onDone();
    }
  }

  async function handleAcceptCounter() {
    setLoading(true);
    setError(null);
    const res = await acceptCounterMatch(match.id);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else {
      toast("Contrapropuesta aceptada — ranking actualizado");
      onDone();
    }
  }

  async function handleProposeCounter() {
    setLoading(true);
    setError(null);
    const res = await proposeCounterMatch(match.id, {
      setScores: counterScores,
      winningTeam: counterWinner,
    });
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else {
      toast("Contrapropuesta enviada");
      onDone();
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
      <p className="text-xs font-bold uppercase text-amber-400">
        {match.status === "counter_proposed"
          ? "Contrapropuesta pendiente"
          : "Confirmar resultado"}
      </p>
      <p className="mt-1 font-mono text-xl text-white">{scoreStr}</p>
      <p className="text-sm text-zinc-400">
        {winnerNames} vs {loserNames} · {formatFormat(match.format)}
      </p>
      <p
        className={`mt-1 text-xs ${urgent ? "font-bold text-red-400" : "text-zinc-500"}`}
      >
        Cargado por {match.submitter_name} ·{" "}
        {hoursLeft === 0 ? "Vence pronto" : `Quedan ${hoursLeft}h`}
      </p>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {match.role === "needs_confirm" && !disputing && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl bg-lime-500 font-bold text-black disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setDisputing(true)}
            disabled={loading}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl border border-white/20 text-zinc-300 active:scale-[0.98]"
          >
            <X className="h-4 w-4" /> Otro resultado
          </button>
        </div>
      )}

      {match.role === "needs_accept_counter" && (
        <button
          type="button"
          onClick={handleAcceptCounter}
          disabled={loading}
          className="mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-lime-500 font-bold text-black disabled:opacity-50 active:scale-[0.98]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Aceptar contrapropuesta
        </button>
      )}

      {disputing && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-400">Proponé el resultado correcto:</p>
          <div className="grid grid-cols-2 gap-2">
            {([1, 2] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCounterWinner(t)}
                className={`min-h-[44px] rounded-lg border text-sm font-bold active:scale-[0.98] ${
                  counterWinner === t
                    ? "border-lime-400 text-lime-400"
                    : "border-white/10 text-zinc-400"
                }`}
              >
                Ganó Equipo {t}
              </button>
            ))}
          </div>
          {counterScores.map((set, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
            >
              <span className="text-sm text-zinc-400">Set {i + 1}</span>
              <div className="flex items-center gap-2">
                <ScoreControl
                  label="Eq1"
                  value={set.p1}
                  onDec={() => updateCounterSet(i, "p1", -1)}
                  onInc={() => updateCounterSet(i, "p1", 1)}
                />
                <span className="text-zinc-600">-</span>
                <ScoreControl
                  label="Eq2"
                  value={set.p2}
                  onDec={() => updateCounterSet(i, "p2", -1)}
                  onInc={() => updateCounterSet(i, "p2", 1)}
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDisputing(false)}
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 text-sm text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProposeCounter}
              disabled={loading}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 font-bold text-black disabled:opacity-50 active:scale-[0.98]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
