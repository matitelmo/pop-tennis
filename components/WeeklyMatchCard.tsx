"use client";

import Link from "next/link";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WEEKLY_MATCH_WIN_MULTIPLIER } from "@/lib/constants";
import type { WeeklyMatchAssignment } from "@/lib/actions/weekly-match";

type Props = {
  assignment: WeeklyMatchAssignment | null;
};

export function WeeklyMatchCard({ assignment }: Props) {
  if (!assignment) {
    return (
      <Card className="border-border-subtle">
        <h2 className="text-sm font-bold text-zinc-400">Tu Partido de la Semana</h2>
        <p className="mt-2 text-caption">
          Esta semana no hay emparejamiento disponible (pocos jugadores activos o sin rivales
          cercanos en el ranking).
        </p>
      </Card>
    );
  }

  const { opponent, userRank, opponentRank, rankDiff, playedThisWeek } = assignment;
  const bonusLabel = `×${WEEKLY_MATCH_WIN_MULTIPLIER}`;

  return (
    <Card className="border-accent/20 bg-gradient-to-b from-accent-muted/30 to-transparent">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold text-accent">Tu Partido de la Semana</h2>
        {playedThisWeek && <Badge variant="accent">Jugado esta semana</Badge>}
      </div>
      <p className="mt-1 text-caption">
        Rival a ±3 puestos de vos — bonus {bonusLabel} si ganás esta semana
      </p>
      <div className="mt-3">
        <PlayNudgeChip
          id={opponent.id}
          name={opponent.full_name}
          variant="rival"
          showChallenge
        />
        <p className="mt-2 text-xs text-zinc-500">
          {opponent.full_name} · #{opponentRank} · {opponent.rating} pts · vos #{userRank} (Δ
          {rankDiff} puestos)
        </p>
      </div>
      <Link
        href={`/perfil/${opponent.id}`}
        className="mt-2 inline-block text-xs font-bold text-accent underline"
      >
        Ver perfil
      </Link>
    </Card>
  );
}
