export const NOTIFICATION_COPY = {
  upset: (winner: string, loser: string) =>
    `¡Picanchiii! ${winner} le acaba de ganar a ${loser} y sumó una montaña de puntos.`,
  rankPass: (name: string) =>
    `Ojo que ${name} te acaba de pasar en la tabla. ¿Te vas a quedar de brazos cruzados, cerote?`,
  inactivityDay13:
    "Llevás 13 días sin jugar, cerote. Mañana te cae el hachazo de -25 pts por fantasma 👻.",
  tercerTiempo: "Terminó el partido. ¿Salen unas pupusas / burgas de festejo?",
} as const;
