"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";
import { PointsReveal } from "@/components/PointsReveal";
import { MatchPointContext } from "@/components/MatchPointContext";
import { SetScoresEditor } from "@/components/SetScoresEditor";
import {
  getCommunityProfilesBySlug,
  previewMatchDelta,
  submitMatch,
} from "@/lib/actions/match";
import { validateMatchScores } from "@/lib/match/set-scores";
import { formatTeamName } from "@/lib/match/score-display";
import type { MatchFormat, Profile, SetScore } from "@/types/database";
import type { MatchPointSummary } from "@/lib/match-labels";
import { useCommunity } from "@/components/providers/CommunityProvider";

type Props = {
  currentUserId: string;
  communitySlug: string;
  allowedFormats: MatchFormat[];
};

type RevealState = {
  deltas: Record<string, number>;
  names: Record<string, string>;
  winnerIds: string[];
  loserIds: string[];
  scoreStr: string;
  setScores: SetScore[];
  team1Ids: string[];
  team2Ids: string[];
  winningTeam: 1 | 2;
  pending: boolean;
  summary?: MatchPointSummary;
};

export function MatchWizard({ currentUserId, communitySlug, allowedFormats }: Props) {
  const { translate: tr } = useCommunity();
  const stepLabels = [tr("mwStepFormat"), tr("mwStepPlayers"), tr("mwStepScore")];
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"1v1" | "2v2">("1v1");
  const [bestOf, setBestOf] = useState<1 | 3 | 5>(3);
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

  const allowedBestOf = Array.from(
    new Set(
      allowedFormats
        .filter((f) => f.startsWith(`${mode}_`))
        .map((f) => Number(f.split("_bo")[1]) as 1 | 3 | 5)
    )
  ).sort((a, b) => a - b) as (1 | 3 | 5)[];

  const teamSize = mode === "1v1" ? 1 : 2;
  const format: MatchFormat = `${mode}_bo${bestOf}` as MatchFormat;

  const canProceedStep2 =
    team1Ids.length === teamSize && team2Ids.length === teamSize;

  const scoreValidationError = validateMatchScores(setScores, bestOf, winningTeam);
  const team1Label = formatTeamName(team1Ids, Object.fromEntries(profiles.map((p) => [p.id, p.full_name])));
  const team2Label = formatTeamName(team2Ids, Object.fromEntries(profiles.map((p) => [p.id, p.full_name])));

  const loadPreview = useCallback(async () => {
    if (!canProceedStep2 || scoreValidationError) {
      setPreview(null);
      setPreviewError(scoreValidationError ?? tr("mwCompleteScorePreview"));
      return;
    }
    const result = await previewMatchDelta({
      format,
      team1Ids,
      team2Ids,
      winningTeam,
      setScores,
      communitySlug,
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
        setScores,
        team1Ids,
        team2Ids,
        winningTeam,
        pending: false,
        summary: result.summary,
      });
      setPreviewError(null);
    } else {
      setPreview(null);
      setPreviewError(
        result.error ?? tr("mwCompleteScorePreview")
      );
    }
  }, [
    canProceedStep2,
    scoreValidationError,
    format,
    team1Ids,
    team2Ids,
    winningTeam,
    setScores,
    profiles,
    communitySlug,
    tr,
  ]);

  useEffect(() => {
    getCommunityProfilesBySlug(communitySlug).then((rows) =>
      setProfiles(rows as Profile[])
    );
  }, [communitySlug]);

  useEffect(() => {
    if (!allowedBestOf.includes(bestOf)) {
      setBestOf(allowedBestOf[0] ?? 3);
    }
  }, [mode, allowedBestOf, bestOf]);

  useEffect(() => {
    setTeam1Ids([]);
    setTeam2Ids([]);
  }, [mode]);

  useEffect(() => {
    setSetScores((prev) => {
      const trimmed = prev.slice(0, bestOf);
      return trimmed.length ? trimmed : [{ p1: 6, p2: 4 }];
    });
  }, [bestOf]);

  useEffect(() => {
    if (step === 3) loadPreview();
  }, [step, loadPreview]);

  function resetWizard() {
    setStep(1);
    setTeam1Ids([]);
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

  const handleSubmit = async () => {
    if (scoreValidationError) {
      setError(scoreValidationError);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await submitMatch({
      format,
      team1Ids,
      team2Ids,
      winningTeam,
      setScores,
      communitySlug,
    });

    setLoading(false);

    if (!result.success || !result.deltas) {
      setError(result.error ?? tr("mwUnknownError"));
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
      setScores,
      team1Ids,
      team2Ids,
      winningTeam,
      pending: result.pendingConfirmation ?? false,
      summary: result.summary,
    });
  };

  return (
    <div className="app-page">
      <div
        className={cn(
          step === 3 && "lg:grid lg:grid-cols-2 lg:items-start lg:gap-8"
        )}
      >
        <div className="space-y-6">
          <StepIndicator steps={stepLabels} current={step} />

          {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">{tr("mwMode")}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["1v1", "2v2"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`min-h-[52px] rounded-2xl border font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    mode === m
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface-glass text-zinc-300"
                  }`}
                >
                  {m === "1v1" ? tr("mwSingles") : tr("mwDoubles")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">{tr("mwFormat")}</p>
            <div className="grid grid-cols-3 gap-2">
              {allowedBestOf.map((bo) => (
                <button
                  key={bo}
                  type="button"
                  onClick={() => setBestOf(bo)}
                  className={`min-h-[52px] rounded-2xl border px-2 font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    bestOf === bo
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface-glass text-zinc-300"
                  }`}
                >
                  Bo{bo}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" onClick={() => setStep(2)} className="w-full" size="lg">
            {tr("mwNext")} <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="rounded-xl bg-surface-glass px-4 py-3 text-sm text-zinc-400">
            {tr("mwPickPlayersHint")}
          </p>
          <PlayerPicker
            title={tr("mwTeam1")}
            searchPlaceholder={tr("mwSearchPlayer")}
            profiles={profiles}
            selected={team1Ids}
            disabled={team2Ids}
            onToggle={(id) => togglePlayer(1, id)}
            highlight={winningTeam === 1}
          />
          <PlayerPicker
            title={tr("mwTeam2")}
            searchPlaceholder={tr("mwSearchPlayer")}
            profiles={profiles}
            selected={team2Ids}
            disabled={team1Ids}
            onToggle={(id) => togglePlayer(2, id)}
            highlight={winningTeam === 2}
          />
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-400">{tr("mwWhoWon")}</p>
            <div className="grid grid-cols-2 gap-3">
              {([1, 2] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWinningTeam(t)}
                  className={`min-h-[44px] rounded-xl border font-bold active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    winningTeam === t
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border text-zinc-400"
                  }`}
                >
                  {t === 1 ? tr("mwTeam1") : tr("mwTeam2")}
                </button>
              ))}
            </div>
          </div>
          {!canProceedStep2 && (
            <p className="text-center text-xs text-amber-400">
              {tr("mwPickPrefix")} {teamSize}{" "}
              {teamSize > 1 ? tr("mwPickPlayers") : tr("mwPickPlayer")} {tr("mwPickPerTeam")}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1" size="lg">
              <ChevronLeft className="h-5 w-5" /> {tr("mwBack")}
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1" size="lg">
              {tr("mwNext")} <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-body">
            {tr("mwScoreHint")
              .replace("{team1}", team1Label || tr("mwTeam1"))
              .replace("{team2}", team2Label || tr("mwTeam2"))}
          </p>
          <SetScoresEditor
            setScores={setScores}
            onChange={setSetScores}
            bestOf={bestOf}
            team1Label={team1Label || "Eq1"}
            team2Label={team2Label || "Eq2"}
          />

          <div className="lg:hidden">
            <MatchPreviewPanel preview={preview} previewError={previewError} tr={tr} />
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
          )}
          <div className="flex gap-3 pb-4">
            <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1" size="lg">
              <ChevronLeft className="h-5 w-5" /> {tr("mwBack")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading || !preview} className="flex-1" size="lg">
              {loading ? tr("mwSaving") : tr("mwSaveMatch")}
            </Button>
          </div>
        </div>
      )}
        </div>

        {step === 3 && (
          <div className="hidden lg:sticky lg:top-6 lg:block">
            <MatchPreviewPanel preview={preview} previewError={previewError} tr={tr} />
          </div>
        )}
      </div>

      {reveal && (
        <PointsReveal
          {...reveal}
          currentUserId={currentUserId}
          onClose={() => {
            setReveal(null);
            resetWizard();
          }}
        />
      )}
    </div>
  );
}

function MatchPreviewPanel({
  preview,
  previewError,
  tr,
}: {
  preview: RevealState | null;
  previewError: string | null;
  tr: (key: import("@/lib/i18n/messages").MessageKey) => string;
}) {
  if (preview) {
    return (
      <Card className="border-accent/20 bg-surface-elevated">
        <p className="text-xs font-bold uppercase text-accent">{tr("mwPreviewTitle")}</p>
        <div className="mt-2 space-y-1">
          {Object.entries(preview.deltas).map(([id, delta]) => (
            <div key={id} className="flex justify-between text-sm">
              <span className="text-zinc-300">{preview.names[id]}</span>
              <span className="font-bold text-accent">
                {delta >= 0 ? "+" : ""}
                {delta}
              </span>
            </div>
          ))}
        </div>
        {preview.summary && <MatchPointContext summary={preview.summary} />}
      </Card>
    );
  }

  if (previewError) {
    return (
      <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">{previewError}</p>
    );
  }

  return (
    <Card className="border-border-subtle bg-surface-glass">
      <p className="text-sm text-zinc-400">{tr("mwPreviewPlaceholder")}</p>
    </Card>
  );
}

function PlayerPicker({
  title,
  searchPlaceholder,
  profiles,
  selected,
  disabled,
  onToggle,
  highlight,
}: {
  title: string;
  searchPlaceholder: string;
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
      <p className={cn("mb-3 text-sm font-medium", highlight ? "text-accent" : "text-zinc-400")}>
        {title} {highlight && "🏆"}
      </p>
      {showSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-3 w-full min-h-[44px] rounded-xl border border-border bg-surface-glass px-4 text-sm text-white outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
      )}
      <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-3 lg:gap-2">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          const isDisabled = disabled.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex min-h-[44px] items-center gap-2 rounded-full pl-1 pr-4 text-sm font-medium transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : isDisabled
                    ? "bg-surface-glass text-zinc-600"
                    : "bg-surface-glass text-zinc-200 hover:bg-white/10"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                  getAvatarColor(p.id)
                )}
              >
                {getInitials(p.full_name)}
              </span>
              {p.full_name}
              {isSelected && (
                <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-accent-foreground text-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
