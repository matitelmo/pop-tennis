import type { CommunityLocale } from "@/lib/community/locale";

const copy = {
  es: {
    upset: (winner: string, loser: string) =>
      `¡Picanchiii! ${winner} le acaba de ganar a ${loser} y sumó una montaña de puntos.`,
    rankPass: (name: string) =>
      `Ojo que ${name} te acaba de pasar en la tabla. ¿Te vas a quedar de brazos cruzados, cerote?`,
    inactivityDay13:
      "Llevás 13 días sin jugar, cerote. Mañana te cae el hachazo de -25 pts por fantasma 👻.",
  },
  en: {
    upset: (winner: string, loser: string) =>
      `Upset! ${winner} just beat ${loser} and gained a big chunk of points.`,
    rankPass: (name: string) =>
      `${name} just passed you on the leaderboard. Time to defend your spot.`,
    inactivityDay13:
      "You have not played in 13 days. Tomorrow you lose 25 pts for inactivity 👻.",
  },
} as const;

export function getNotificationCopy(locale: CommunityLocale) {
  return copy[locale];
}
