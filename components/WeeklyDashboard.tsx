import type { Profile } from "@/types/database";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";

type Props = {
  totalMatches: number;
  totalPlayers: number;
  playedThisWeek: number;
  notPlayed: Profile[];
  userPlayedThisWeek: boolean;
};

export function WeeklyDashboard({
  totalMatches,
  totalPlayers,
  playedThisWeek,
  notPlayed,
  userPlayedThisWeek,
}: Props) {
  const pct = totalPlayers ? Math.round((playedThisWeek / totalPlayers) * 100) : 0;

  return (
    <section className="mb-6 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-lime-400">
        Esta semana
      </h2>
      <p className="mt-1 text-xs text-zinc-500">Objetivo del grupo: 1 partido por semana</p>

      <div
        className={`mt-3 rounded-xl px-3 py-2 text-sm ${
          userPlayedThisWeek
            ? "bg-lime-500/10 text-lime-400"
            : "bg-orange-500/10 text-orange-400"
        }`}
      >
        {userPlayedThisWeek
          ? "✓ Vos ya jugaste esta semana"
          : "Todavía no jugaste esta semana — ¡sumate!"}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-black text-white">{totalMatches}</p>
          <p className="text-[10px] text-zinc-500">Partidos</p>
        </div>
        <div>
          <p className="text-2xl font-black text-lime-400">
            {playedThisWeek}/{totalPlayers}
          </p>
          <p className="text-[10px] text-zinc-500">Jugaron</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{pct}%</p>
          <p className="text-[10px] text-zinc-500">Del grupo</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-lime-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {notPlayed.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-zinc-400">Falta jugar esta semana:</p>
          <div className="flex flex-wrap gap-1.5">
            {notPlayed.map((p) => (
              <PlayNudgeChip key={p.id} id={p.id} name={p.full_name} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
