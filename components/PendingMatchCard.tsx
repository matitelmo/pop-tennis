"use client";

import { useState } from "react";
import {
  acceptCounterMatch,
  confirmMatch,
  proposeCounterMatch,
  type PendingMatch,
  type MatchRevealData,
} from "@/lib/actions/match";
import { SetScoresEditor } from "@/components/SetScoresEditor";
import { MatchScoreBoard } from "@/components/MatchScoreBoard";
import { PointsReveal } from "@/components/PointsReveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatFormat } from "@/lib/utils";
import { formatTeamName } from "@/lib/match/score-display";
import { bestOfFromFormat, validateMatchScores } from "@/lib/match/set-scores";
import type { SetScore } from "@/types/database";
import { Check, Loader2, X } from "lucide-react";

type Props = {
  match: PendingMatch;
  profileNames: Record<string, string>;
  currentUserId: string;
  onDone: () => void;
};

export function PendingMatchCard({ match, profileNames, currentUserId, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputing, setDisputing] = useState(false);
  const [reveal, setReveal] = useState<MatchRevealData | null>(null);
  const [counterScores, setCounterScores] = useState<SetScore[]>([...match.set_scores]);
  const [counterWinner, setCounterWinner] = useState<1 | 2>(match.winning_team as 1 | 2);
  const counterBestOf = bestOfFromFormat(match.format);
  const counterValidationError = validateMatchScores(
    counterScores,
    counterBestOf,
    counterWinner
  );

  const displayScores =
    match.status === "counter_proposed" && match.counter_set_scores
      ? match.counter_set_scores
      : match.set_scores;
  const displayWinningTeam =
    match.status === "counter_proposed" && match.counter_winning_team
      ? (match.counter_winning_team as 1 | 2)
      : (match.winning_team as 1 | 2);
  const team1Label = formatTeamName(match.team1_ids, profileNames);
  const team2Label = formatTeamName(match.team2_ids, profileNames);
  const deadline = new Date(match.confirmation_deadline);
  const totalMs = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - (deadline.getTime() - totalMs);
  const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
  const hoursLeft = Math.max(
    0,
    Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const urgent = hoursLeft <= 6;

  const winnerNames = match.winner_ids.map((id) => profileNames[id] ?? "?").join(" & ");
  const loserNames = match.loser_ids.map((id) => profileNames[id] ?? "?").join(" & ");
  const viewerOnTeam1 = match.team1_ids.includes(currentUserId);
  const viewerOnTeam2 = match.team2_ids.includes(currentUserId);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const res = await confirmMatch(match.id);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else if (res.reveal) setReveal(res.reveal);
    else onDone();
  }

  async function handleAcceptCounter() {
    setLoading(true);
    setError(null);
    const res = await acceptCounterMatch(match.id);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else if (res.reveal) setReveal(res.reveal);
    else onDone();
  }

  async function handleProposeCounter() {
    if (counterValidationError) {
      setError(counterValidationError);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await proposeCounterMatch(match.id, {
      setScores: counterScores,
      winningTeam: counterWinner,
    });
    setLoading(false);
    if (!res.success) setError(res.error ?? "Error");
    else onDone();
  }

  return (
    <>
      <Card className="border-warning/30 bg-warning/5">
        <p className="text-xs font-bold uppercase text-warning">
          {match.status === "counter_proposed"
            ? "Contrapropuesta pendiente"
            : "Confirmar resultado"}
        </p>
        <p className="mt-1 text-caption">
          Resultado propuesto · {formatFormat(match.format)}
        </p>
        <div className="mt-3">
          <MatchScoreBoard
            setScores={displayScores}
            team1Ids={match.team1_ids}
            team2Ids={match.team2_ids}
            profileNames={profileNames}
            currentUserId={currentUserId}
            winningTeam={displayWinningTeam}
          />
        </div>
        {!viewerOnTeam1 && !viewerOnTeam2 && (
          <p className="mt-2 text-caption">
            {winnerNames} le ganó a {loserNames}
          </p>
        )}

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-glass">
            <div
              className={`h-full rounded-full transition-all ${urgent ? "bg-danger" : "bg-warning"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`mt-1 text-caption ${urgent ? "font-bold text-danger" : ""}`}>
            Cargado por {match.submitter_name} ·{" "}
            {hoursLeft === 0 ? "Vence pronto" : `Quedan ${hoursLeft}h`}
          </p>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {match.role === "needs_confirm" && !disputing && (
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDisputing(true)}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4" /> Otro resultado
            </Button>
          </div>
        )}

        {match.role === "needs_accept_counter" && (
          <Button
            type="button"
            onClick={handleAcceptCounter}
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Aceptar contrapropuesta
          </Button>
        )}

        {disputing && (
          <div className="mt-4 space-y-3">
            <p className="text-body">Proponé el resultado correcto:</p>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCounterWinner(t)}
                  className={`min-h-[44px] rounded-lg border px-2 text-sm font-bold active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    counterWinner === t
                      ? "border-accent text-accent"
                      : "border-border text-zinc-400"
                  }`}
                >
                  Ganó {t === 1 ? team1Label : team2Label}
                </button>
              ))}
            </div>
            <SetScoresEditor
              setScores={counterScores}
              onChange={setCounterScores}
              bestOf={counterBestOf}
              team1Label={team1Label}
              team2Label={team2Label}
            />
            {counterValidationError && (
              <p className="text-sm text-warning">{counterValidationError}</p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setDisputing(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleProposeCounter}
                disabled={loading || !!counterValidationError}
                className="flex-1 bg-warning text-accent-foreground hover:bg-warning/90"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {reveal && (
        <PointsReveal
          {...reveal}
          currentUserId={currentUserId}
          onClose={() => {
            setReveal(null);
            onDone();
          }}
        />
      )}
    </>
  );
}
