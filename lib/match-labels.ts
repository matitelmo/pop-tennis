import type { MatchFormat } from "@/types/database";
import { formatFormat } from "@/lib/utils";

export type MatchMultipliers = {
  format: number;
  sets: number;
  weekly: number;
};

export type MatchPointSummary = {
  headline: string;
  details: string[];
  tags: string[];
};

function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

export function buildMatchPointSummary(params: {
  winnerRatings: number[];
  loserRatings: number[];
  format: MatchFormat;
  multipliers: MatchMultipliers;
}): MatchPointSummary {
  const winnerAvg = averageRating(params.winnerRatings);
  const loserAvg = averageRating(params.loserRatings);
  const gap = loserAvg - winnerAvg;

  let headline: string;
  if (gap >= 150) {
    headline = "Victoria valiosa";
  } else if (gap <= -150) {
    headline = "Eras favorito";
  } else {
    headline = "Partido parejo";
  }

  const details: string[] = [];
  const tags: string[] = [];

  if (gap >= 150) {
    details.push(
      `Ganarle a alguien ~${Math.round(gap)} pts arriba en el ranking suma bastante`
    );
    tags.push("Upset");
  } else if (gap <= -150) {
    details.push(
      `Contra alguien ~${Math.round(-gap)} pts abajo, ganar suma poco y perder duele más`
    );
    tags.push("Favorito");
  } else {
    details.push("Movimiento normal según cómo están en el ranking");
    tags.push("Parejo");
  }

  const formatLabel = formatFormat(params.format);
  if (params.multipliers.format >= 1.5) {
    details.push(`${formatLabel} — singles largo, vale más`);
    tags.push("Singles Bo5");
  } else if (params.multipliers.format >= 1.2) {
    details.push(`${formatLabel} — singles, vale un poco más`);
    tags.push("Singles");
  } else if (params.multipliers.format < 1) {
    details.push(`${formatLabel} — movimiento un poco más chico`);
    tags.push("Dobles Bo3");
  }

  if (params.multipliers.sets > 1) {
    details.push("Ganaste en sets corridos — bonus");
    tags.push("Sets corridos");
  }

  if (params.multipliers.weekly > 1) {
    details.push("Partido de la Semana — bonus ×1.25 al ganador");
    tags.push("Partido de la Semana");
  }

  return { headline, details, tags };
}

export function getMatchLabel(delta: number, isWinner: boolean): string {
  if (isWinner) {
    if (delta >= 40) return "¡Picanchiii! Paseo histórico 🚀";
    if (delta >= 25) return "¡Qué chivo! Triunfo sólido 🔥";
    return "Victoria trabajada 🎾";
  }
  if (Math.abs(delta) >= 30) return "A ajustar la vaselina... 🧼";
  return "En las malas se ve al equipo 🩹";
}
