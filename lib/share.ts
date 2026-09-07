type ShareMatchParams = {
  winnerNames: string[];
  loserNames: string[];
  scoreStr: string;
  deltas?: Record<string, number>;
  pending?: boolean;
  appUrl?: string;
};

export function buildMatchShareText(params: ShareMatchParams): string {
  const winners = params.winnerNames.join(" & ");
  const losers = params.loserNames.join(" & ");
  const url = params.appUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  const deltaStr = params.deltas
    ? Object.values(params.deltas)
        .map((d) => `${d >= 0 ? "+" : ""}${d} pts`)
        .join(", ")
    : "";

  return `🎾 Fence — ${winners} le ganó a ${losers} ${params.scoreStr}${deltaStr ? ` (${deltaStr})` : ""}${params.pending ? " (pendiente confirmación)" : ""}. Ranking: ${url}/ranking`;
}

export function shareViaWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ text }).catch(() => {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    });
  } else {
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }
}

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthEnd(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}
