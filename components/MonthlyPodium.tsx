import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import { cn } from "@/lib/utils";

type Props = {
  entries: LeaderboardEntry[];
};

const PODIUM_HEIGHT = ["h-20", "h-16", "h-12"];
const PODIUM_COLORS = [
  "from-amber-400/30 to-amber-600/10 border-amber-400/30",
  "from-zinc-300/20 to-zinc-500/10 border-zinc-400/20",
  "from-orange-400/20 to-orange-600/10 border-orange-400/20",
];

export function MonthlyPodium({ entries }: Props) {
  const top3 = [...entries]
    .sort((a, b) => b.monthlyDelta - a.monthlyDelta)
    .slice(0, 3)
    .filter((e) => e.monthlyDelta !== 0);

  if (!top3.length) return null;

  const now = new Date();
  const monthName = now.toLocaleDateString("es-AR", { month: "long" });
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return (
    <Card className="mb-4 border-warning/20 bg-gradient-to-b from-warning/10 to-transparent">
      <p className="text-xs font-bold uppercase tracking-wide text-warning">
        Temporada {monthName} — cierra el {lastDay}/{now.getMonth() + 1}
      </p>
      <div className="mt-4 flex items-end justify-center gap-2">
        {[1, 0, 2].map((idx) => {
          const entry = top3[idx];
          if (!entry) return <div key={idx} className="w-1/3" />;
          return (
            <Link
              key={entry.id}
              href={`/perfil/${entry.id}`}
              className={cn(
                "flex w-1/3 flex-col items-center rounded-t-xl border bg-gradient-to-b p-2 text-center transition active:scale-[0.98]",
                PODIUM_HEIGHT[idx],
                PODIUM_COLORS[idx]
              )}
            >
              <span className="text-lg font-black text-white">#{idx + 1}</span>
              <span className="mt-1 truncate text-xs font-semibold text-white">
                {entry.full_name.split(" ")[0]}
              </span>
              <span className="text-xs font-bold text-accent">
                {entry.monthlyDelta >= 0 ? "+" : ""}
                {entry.monthlyDelta}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
