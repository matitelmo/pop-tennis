"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchPointContext } from "@/components/MatchPointContext";
import { MatchScoreBoard } from "@/components/MatchScoreBoard";
import { TercerTiempoModal } from "@/components/InAppNotifications";
import { useOptionalCommunity } from "@/components/providers/CommunityProvider";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { Button } from "@/components/ui/Button";
import { buildMatchShareText, shareViaWhatsApp } from "@/lib/share";
import { getMatchLabelLocalized } from "@/lib/i18n/match-copy";
import type { MatchPointSummary } from "@/lib/match-labels";
import { cn } from "@/lib/utils";
import type { SetScore } from "@/types/database";

type Props = {
  deltas: Record<string, number>;
  names: Record<string, string>;
  winnerIds: string[];
  loserIds: string[];
  scoreStr: string;
  setScores?: SetScore[];
  team1Ids?: string[];
  team2Ids?: string[];
  winningTeam?: 1 | 2;
  currentUserId?: string;
  pending?: boolean;
  summary?: MatchPointSummary;
  onClose: () => void;
  showCelebration?: boolean;
};

function AnimatedDelta({ value, pending }: { value: number; pending: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = value;
    const steps = 20;
    const step = target / steps;
    let current = 0;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      current += step;
      if (frame >= steps) {
        setDisplay(target);
        clearInterval(id);
      } else {
        setDisplay(Math.round(current));
      }
    }, 25);
    return () => clearInterval(id);
  }, [value]);

  const shown = display;
  const hasUpset = !pending && value >= 40;

  return (
    <span
      className={cn(
        "text-xl font-black tabular-nums",
        shown >= 0 ? "text-success" : "text-danger",
        hasUpset && "animate-pulse"
      )}
    >
      {shown >= 0 ? "+" : ""}
      {shown}
    </span>
  );
}

export function PointsReveal({
  deltas,
  names,
  winnerIds,
  loserIds,
  scoreStr,
  setScores,
  team1Ids,
  team2Ids,
  winningTeam,
  currentUserId,
  pending = false,
  summary,
  onClose,
  showCelebration = true,
}: Props) {
  const community = useOptionalCommunity();
  const locale = community?.locale ?? "es";
  const tr = community?.translate ?? ((key: MessageKey) => t(locale, key));
  const enableCelebration = showCelebration && locale !== "en";
  const [visible, setVisible] = useState(false);
  const [showTercerTiempo, setShowTercerTiempo] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (pending || !enableCelebration) return;
    const key = `tercer_tiempo_${scoreStr}_${winnerIds.join("-")}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => setShowTercerTiempo(true), 600);
    return () => clearTimeout(timer);
  }, [pending, enableCelebration, scoreStr, winnerIds]);

  const winnerNames = winnerIds.map((id) => names[id] ?? "?");
  const loserNames = loserIds.map((id) => names[id] ?? "?");

  function handleShare() {
    const text = buildMatchShareText({
      winnerNames,
      loserNames,
      scoreStr,
      deltas,
      pending,
    });
    shareViaWhatsApp(text);
  }

  function dismissTercerTiempo() {
    const key = `tercer_tiempo_${scoreStr}_${winnerIds.join("-")}`;
    sessionStorage.setItem(key, "1");
    setShowTercerTiempo(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className={cn(
            "w-full max-w-sm transform rounded-3xl border border-accent/30 bg-gradient-to-b from-surface-elevated to-surface-nav p-6 shadow-2xl transition-all duration-500 lg:max-w-lg",
            visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-2 text-center text-2xl font-black text-accent">
            {pending ? tr("prResultSent") : tr("prMatchConfirmed")}
          </h2>
          <p className="mb-4 text-center text-body">
            {pending ? tr("prWaitingConfirm") : tr("prPointsInRanking")}
          </p>
          {(summary?.tags.includes("Partido de la Semana") ||
            summary?.tags.includes("Match of the Week")) && (
            <p className="mb-3 text-center text-xs font-bold text-accent">
              {tr("prWeeklyBonus")}
            </p>
          )}
          {setScores && team1Ids && team2Ids ? (
            <div className="mb-4">
              <MatchScoreBoard
                setScores={setScores}
                team1Ids={team1Ids}
                team2Ids={team2Ids}
                profileNames={names}
                currentUserId={currentUserId}
                winningTeam={winningTeam}
                compact
              />
            </div>
          ) : (
            <p className="mb-4 text-center font-mono text-sm text-zinc-400">{scoreStr}</p>
          )}
          <div className="space-y-3">
            {Object.entries(deltas).map(([id, delta]) => {
              const isWinner = winnerIds.includes(id);
              const label = getMatchLabelLocalized(delta, isWinner, locale);
              return (
                <div key={id} className="rounded-xl bg-surface-glass px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{names[id]}</span>
                    <AnimatedDelta value={delta} pending={pending} />
                  </div>
                  <p className="mt-1 text-caption">{label}</p>
                </div>
              );
            })}
          </div>
          {summary && <MatchPointContext summary={summary} />}
          <Link href="/reglas#calculo" className="mt-4 block text-center text-caption underline">
            {tr("prMoreRanking")}
          </Link>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={handleShare} className="flex-1">
              {tr("prShareWhatsApp")}
            </Button>
            <Button onClick={onClose} className="flex-1">
              {tr("prDone")}
            </Button>
          </div>
        </div>
      </div>
      {showTercerTiempo && enableCelebration && (
        <TercerTiempoModal onDismiss={dismissTercerTiempo} />
      )}
    </>
  );
}
