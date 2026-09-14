import type { CommunityLocale } from "@/lib/community/locale";
import type { MatchFormat } from "@/types/database";
import { formatFormatLocalized } from "@/lib/i18n/format-format";
import type { MatchMultipliers, MatchPointSummary } from "@/lib/match-labels";

export function getMatchLabelLocalized(
  delta: number,
  isWinner: boolean,
  locale: CommunityLocale
): string {
  if (locale === "en") {
    if (isWinner) {
      if (delta >= 40) return "Huge upset win";
      if (delta >= 25) return "Solid win";
      return "Hard-fought win";
    }
    if (Math.abs(delta) >= 30) return "Tough loss — time to adjust";
    return "Close one — regroup";
  }
  if (isWinner) {
    if (delta >= 40) return "¡Picanchiii! Paseo histórico 🚀";
    if (delta >= 25) return "¡Qué chivo! Triunfo sólido 🔥";
    return "Victoria trabajada 🎾";
  }
  if (Math.abs(delta) >= 30) return "A ajustar la vaselina... 🧼";
  return "En las malas se ve al equipo 🩹";
}

function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

export function buildMatchPointSummaryLocalized(params: {
  winnerRatings: number[];
  loserRatings: number[];
  format: MatchFormat;
  multipliers: MatchMultipliers;
  locale: CommunityLocale;
}): MatchPointSummary {
  const { locale } = params;
  const winnerAvg = averageRating(params.winnerRatings);
  const loserAvg = averageRating(params.loserRatings);
  const gap = loserAvg - winnerAvg;

  let headline: string;
  if (gap >= 150) {
    headline = locale === "en" ? "Valuable win" : "Victoria valiosa";
  } else if (gap <= -150) {
    headline = locale === "en" ? "You were the favorite" : "Eras favorito";
  } else {
    headline = locale === "en" ? "Even match" : "Partido parejo";
  }

  const details: string[] = [];
  const tags: string[] = [];

  if (gap >= 150) {
    details.push(
      locale === "en"
        ? `Beating someone ~${Math.round(gap)} pts higher moves the needle`
        : `Ganarle a alguien ~${Math.round(gap)} pts arriba en el ranking suma bastante`
    );
    tags.push("Upset");
  } else if (gap <= -150) {
    details.push(
      locale === "en"
        ? `Vs someone ~${Math.round(-gap)} pts lower — small gain, bigger loss risk`
        : `Contra alguien ~${Math.round(-gap)} pts abajo, ganar suma poco y perder duele más`
    );
    tags.push(locale === "en" ? "Favorite" : "Favorito");
  } else {
    details.push(
      locale === "en"
        ? "Normal movement based on current rankings"
        : "Movimiento normal según cómo están en el ranking"
    );
    tags.push(locale === "en" ? "Even" : "Parejo");
  }

  const formatLabel = formatFormatLocalized(params.format, locale);
  if (params.format.endsWith("bo1")) {
    details.push(
      locale === "en"
        ? `${formatLabel} — short match, smaller swing`
        : `${formatLabel} — partido corto, movimiento más chico`
    );
    tags.push(locale === "en" ? "One set" : "Un set");
  } else if (params.multipliers.format >= 1.5) {
    details.push(
      locale === "en"
        ? `${formatLabel} — long singles, counts more`
        : `${formatLabel} — singles largo, vale más`
    );
    tags.push(locale === "en" ? "Singles Bo5" : "Singles Bo5");
  } else if (params.multipliers.format >= 1.2) {
    details.push(
      locale === "en"
        ? `${formatLabel} — singles, slightly more weight`
        : `${formatLabel} — singles, vale un poco más`
    );
    tags.push(locale === "en" ? "Singles" : "Singles");
  } else if (params.multipliers.format < 0.7) {
    details.push(
      locale === "en"
        ? `${formatLabel} — short doubles, minimal swing`
        : `${formatLabel} — dobles corto, movimiento mínimo`
    );
    tags.push(locale === "en" ? "Doubles 1 set" : "Dobles 1 set");
  } else if (params.multipliers.format < 1) {
    details.push(
      locale === "en"
        ? `${formatLabel} — slightly smaller movement`
        : `${formatLabel} — movimiento un poco más chico`
    );
    tags.push(locale === "en" ? "Doubles Bo3" : "Dobles Bo3");
  }

  if (params.multipliers.sets > 1) {
    details.push(locale === "en" ? "Straight sets — bonus" : "Ganaste en sets corridos — bonus");
    tags.push(locale === "en" ? "Straight sets" : "Sets corridos");
  }

  if (params.multipliers.weekly > 1) {
    details.push(
      locale === "en"
        ? "Match of the Week — ×1.25 winner bonus"
        : "Partido de la Semana — bonus ×1.25 al ganador"
    );
    tags.push(locale === "en" ? "Match of the Week" : "Partido de la Semana");
  }

  return { headline, details, tags };
}
