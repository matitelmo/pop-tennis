"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PointsReveal } from "@/components/PointsReveal";
import { MatchPointContext } from "@/components/MatchPointContext";
import { ScoreControl } from "@/components/ScoreControl";
import {
  getAllProfiles,
  previewMatchDelta,
  submitMatch,
} from "@/lib/actions/match";
import type { MatchFormat, Profile, SetScore } from "@/types/database";
import type { MatchPointSummary } from "@/lib/match-labels";

const STEP_LABELS = ["Formato", "Jugadores", "Score"];

type Props = {
  currentUserId: string;
};

type RevealState = {
  deltas: Record<string, number>;
  names: Record<string, string>;
  winnerIds: string[];
  loserIds: string[];
  scoreStr: string;
  pending: boolean;
  summary?: MatchPointSummary;
};

export function MatchWizard({ currentUserId }: Props) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"1v1" | "2v2">("1v1");
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [team1Ids, setTeam1Ids] = useState<string[]>([]);
  const [team2Ids, setTeam2Ids] = useState<string[]>([]);
  const [winningTeam, setWinningTeam] = useState<1 | 2>(1);
  const [setScores, setSetScores] = useState<SetScore[]>([{ p1: 6, p2: 4 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RevealState | null>(null);
  const [reveal, setReveal] = useState<RevealState | null>(null);

  const teamSize = mode === "1v1" ? 1 : 2;
  const format: MatchFormat = `${mode}_bo${bestOf}` as MatchFormat;
  const maxSets = bestOf;

  const canProceedStep2 =
    team1Ids.length === teamSize && team2Ids.length === teamSize;

  const loadPreview = useCallback(async () => {
    if (!canProceedStep2) return;
    const result = await previewMatchDelta({
      format,
      team1Ids,
      team2Ids,
      winningTeam,
      setScores,
    });
    if (result.success && result.deltas) {
      const team1Won = winningTeam === 1;
      const winnerIds = team1Won ? team1Ids : team2Ids;
      const loserIds = team1Won ? team2Ids : team1Ids;
      setPreview({
        deltas: result.deltas,
        names: Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
        winnerIds,
        loserIds,
        scoreStr: setScores.map((s) => `${s.p1}-${s.p2}`).join(" · "),
        pending: true,
        summary: result.summary,
      });
      setPreviewError(null);
    } else {
      setPreview(null);
      setPreviewError(
        result.error ?? "Completá el score para ver el impacto en puntos"
      );
    }
  }, [
    canProceedStep2,
    format,
    team1Ids,
    team2Ids,
    winningTeam,
    setScores,
    profiles,
  ]);

  useEffect(() => {
    getAllProfiles().then((data) => {
      setProfiles(data);
      if (currentUserId && data.some((p) => p.id === currentUserId)) {
        setTeam1Ids([currentUserId]);
      }
    });
  }, [currentUserId]);

  useEffect(() => {
    setTeam1Ids(currentUserId ? [currentUserId] : []);
    setTeam2Ids([]);
  }, [mode, currentUserId]);

  useEffect(() => {
    if (step === 3) loadPreview();
  }, [step, loadPreview]);

  function resetWizard() {
    setStep(1);
    setTeam1Ids(currentUserId ? [currentUserId] : []);
    setTeam2Ids([]);
    setSetScores([{ p1: 6, p2: 4 }]);
    setPreview(null);
    setPreviewError(null);
    setError(null);
  }

  const togglePlayer = (team: 1 | 2, id: string) => {
    const setter = team === 1 ? setTeam1Ids : setTeam2Ids;
    const current = team === 1 ? team1Ids : team2Ids;
    const other = team === 1 ? team2Ids : team1Ids;

    if (other.includes(id)) return;
    if (current.includes(id)) {
      setter(current.filter((x) => x !== id));
    } else if (current.length < teamSize) {
      setter([...current, id]);
    }
  };

  const updateSet = (index: number, side: "p1" | "p2", delta: number) => {
    setSetScores((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [side]: Math.max(0, Math.min(7, s[side] + delta)) } : s
      )
    );
  };

  const addSet = () => {
    if (setScores.length < maxSets) {
      setSetScores([...setScores, { p1: 6, p2: 4 }]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const result = await submitMatch({
      format,
      team1Ids,
      team2Ids,
      winningTeam,
      setScores,
    });

    setLoading(false);

    if (!result.success || !result.deltas) {
      setError(result.error ?? "Error desconocido");
      return;
    }

    const team1Won = winningTeam === 1;
    const winnerIds = team1Won ? team1Ids : team2Ids;
    const loserIds = team1Won ? team2Ids : team1Ids;

    setReveal({
      deltas: result.deltas,
      names: Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
      winnerIds,
      loserIds,
      scoreStr: setScores.map((s) => `${s.p1}-${s.p2}`).join(" · "),
      pending: true,
      summary: result.summary,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition ${
                s <= step ? "bg-lime-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm font-bold text-white">
          {step}. {STEP_LABELS[step - 1]}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">Modo</p>
            <div className="grid grid-cols-2 gap-3">
              {(["1v1", "2v2"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`min-h-[52px] rounded-2xl border font-bold transition active:scale-[0.98] ${
                    mode === m
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  {m === "1v1" ? "Singles" : "Dobles"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">Formato</p>
            <div className="grid grid-cols-2 gap-3">
              {([3, 5] as const).map((bo) => (
                <button
                  key={bo}
                  type="button"
                  onClick={() => setBestOf(bo)}
                  className={`min-h-[52px] rounded-2xl border font-bold transition active:scale-[0.98] ${
                    bestOf === bo
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  Mejor de {bo}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-lime-500 font-bold text-black active:scale-[0.98]"
          >
            Siguiente <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <PlayerPicker
            title="Equipo 1"
            profiles={profiles}
            selected={team1Ids}
            disabled={team2Ids}
            onToggle={(id) => togglePlayer(1, id)}
            highlight={winningTeam === 1}
          />
          <PlayerPicker
            title="Equipo 2"
            profiles={profiles}
            selected={team2Ids}
            disabled={team1Ids}
            onToggle={(id) => togglePlayer(2, id)}
            highlight={winningTeam === 2}
          />
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">¿Quién ganó?</p>
            <div className="grid grid-cols-2 gap-3">
              {([1, 2] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWinningTeam(t)}
                  className={`min-h-[44px] rounded-xl border font-bold active:scale-[0.98] ${
                    winningTeam === t
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-white/10 text-zinc-400"
                  }`}
                >
                  Equipo {t}
                </button>
              ))}
            </div>
          </div>
          {!canProceedStep2 && (
            <p className="text-center text-xs text-amber-400">
              Elegí {teamSize} jugador{teamSize > 1 ? "es" : ""} por equipo para continuar
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-1 rounded-2xl border border-white/10 text-zinc-300"
            >
              <ChevronLeft className="h-5 w-5" /> Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-1 rounded-2xl bg-lime-500 font-bold text-black disabled:opacity-40 active:scale-[0.98]"
            >
              Siguiente <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Cargá el score de cada set (Equipo 1 vs Equipo 2)
          </p>
          {setScores.map((set, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <span className="text-sm font-medium text-zinc-400">Set {i + 1}</span>
              <ScoreControl
                label="Eq1"
                value={set.p1}
                onDec={() => updateSet(i, "p1", -1)}
                onInc={() => updateSet(i, "p1", 1)}
              />
              <span className="text-zinc-600">-</span>
              <ScoreControl
                label="Eq2"
                value={set.p2}
                onDec={() => updateSet(i, "p2", -1)}
                onInc={() => updateSet(i, "p2", 1)}
              />
            </div>
          ))}
          {setScores.length < maxSets && (
            <button
              type="button"
              onClick={addSet}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-white/20 text-sm text-zinc-400"
            >
              + Agregar set
            </button>
          )}

          {preview && (
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
              <p className="text-xs font-bold uppercase text-lime-400">
                Así moverían los puntos
              </p>
              <div className="mt-2 space-y-1">
                {Object.entries(preview.deltas).map(([id, delta]) => (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{preview.names[id]}</span>
                    <span className="font-bold text-lime-400">
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </span>
                  </div>
                ))}
              </div>
              {preview.summary && <MatchPointContext summary={preview.summary} />}
            </div>
          )}

          {!preview && previewError && (
            <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              {previewError}
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-1 rounded-2xl border border-white/10 text-zinc-300"
            >
              <ChevronLeft className="h-5 w-5" /> Atrás
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !preview}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-lime-500 font-bold text-black disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Guardando..." : "Guardar Partido"}
            </button>
          </div>
        </div>
      )}

      {reveal && (
        <PointsReveal
          {...reveal}
          onClose={() => {
            setReveal(null);
            resetWizard();
          }}
        />
      )}
    </div>
  );
}

function PlayerPicker({
  title,
  profiles,
  selected,
  disabled,
  onToggle,
  highlight,
}: {
  title: string;
  profiles: Profile[];
  selected: string[];
  disabled: string[];
  onToggle: (id: string) => void;
  highlight?: boolean;
}) {
  const [query, setQuery] = useState("");
  const showSearch = profiles.length > 8;

  const filtered = showSearch
    ? profiles.filter((p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase())
      )
    : profiles;

  return (
    <div>
      <p
        className={`mb-3 text-sm font-medium ${
          highlight ? "text-lime-400" : "text-zinc-400"
        }`}
      >
        {title} {highlight && "🏆"}
      </p>
      {showSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jugador..."
          className="mb-3 w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-lime-400"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          const isDisabled = disabled.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              disabled={isDisabled}
              className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition active:scale-95 ${
                isSelected
                  ? "bg-lime-500 text-black"
                  : isDisabled
                    ? "bg-white/5 text-zinc-600"
                    : "bg-white/10 text-zinc-200 hover:bg-white/20"
              }`}
            >
              {p.full_name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
