import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/actions/ranking";

type Props = {
  entries: LeaderboardEntry[];
};

export function MonthlyPodium({ entries }: Props) {
  const top3 = [...entries]
    .sort((a, b) => b.monthlyDelta - a.monthlyDelta)
    .slice(0, 3)
    .filter((e) => e.monthlyDelta !== 0);

  if (!top3.length) return null;

  const now = new Date();
  const monthName = now.toLocaleDateString("es-AR", { month: "long" });
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-400">
        Temporada {monthName} — cierra el {lastDay}/{now.getMonth() + 1}
      </p>
      <div className="mt-3 space-y-2">
        {top3.map((entry, i) => (
          <Link
            key={entry.id}
            href={`/perfil/${entry.id}`}
            className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <span>{medals[i]}</span>
              <span className="font-semibold text-white">{entry.full_name}</span>
            </span>
            <span className="font-bold text-lime-400">
              {entry.monthlyDelta >= 0 ? "+" : ""}
              {entry.monthlyDelta} pts
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
