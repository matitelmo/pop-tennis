export type PaternidadStatus =
  | {
      type: "dominancia";
      badge: string;
      label: string;
      copy: string;
    }
  | {
      type: "rivalidad";
      badge: string;
      copy: string;
    }
  | {
      type: "desfavorable";
      copy: string;
    }
  | {
      type: "none";
      copy: string;
    };

export function getPaternidadStatus(
  userWins: number,
  userLosses: number,
  opponentName: string
): PaternidadStatus {
  const total = userWins + userLosses;
  if (total === 0) {
    return { type: "none", copy: "Sin partidos entre ustedes todavía" };
  }

  const diff = userWins - userLosses;

  if (diff >= 3) {
    return {
      type: "dominancia",
      badge: "👑 Hijo Nuestro",
      label: "Paternidad Clásica",
      copy: `Lo tenés de hijo con un historial de ${userWins}-${userLosses} vs ${opponentName}`,
    };
  }

  if (diff <= -3) {
    return {
      type: "desfavorable",
      copy: `Te tiene alquilado (-${Math.abs(diff)}) vs ${opponentName}`,
    };
  }

  return {
    type: "rivalidad",
    badge: "🔥 Rivalidad Picante",
    copy: `Historial parejo ${userWins}-${userLosses} — cualquiera puede ganar`,
  };
}

export function isRivalidadPareja(userWins: number, userLosses: number): boolean {
  const total = userWins + userLosses;
  if (total === 0) return false;
  return Math.abs(userWins - userLosses) <= 2;
}
