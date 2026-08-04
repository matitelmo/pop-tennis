"use client";

import Link from "next/link";
import { PlayNudgeChip } from "@/components/PlayNudgeChip";
import type { Profile } from "@/types/database";

type Props = {
  rival: { profile: Profile; eloDiff: number } | null;
};

export function RivalOfTheWeek({ rival }: Props) {
  if (!rival) return null;

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-bold text-zinc-400">Rival sugerido</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Similar en ranking y no jugó esta semana
      </p>
      <div className="mt-3">
        <PlayNudgeChip
          id={rival.profile.id}
          name={rival.profile.full_name}
          variant="rival"
          showChallenge
        />
        <p className="mt-2 text-xs text-zinc-500">
          {rival.profile.rating} pts · diferencia {rival.eloDiff} pts
        </p>
      </div>
      <Link
        href={`/perfil/${rival.profile.id}`}
        className="mt-2 inline-block text-xs text-lime-400 underline"
      >
        Ver perfil
      </Link>
    </section>
  );
}
