"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Player = { id: string; full_name: string };

type Props = {
  players: Player[];
  excludeId?: string;
  title?: string;
  limit?: number;
};

export function PlayerSearchList({
  players,
  excludeId,
  title = "Buscar jugador",
  limit,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = players.filter((p) => p.id !== excludeId);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.full_name.toLowerCase().includes(q));
    }
    if (limit) list = list.slice(0, limit);
    return list;
  }, [players, excludeId, query, limit]);

  return (
    <div>
      <h3 className="mb-3 font-bold text-white">{title}</h3>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre..."
        className="mb-3 w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-lime-400"
      />
      <div className="flex flex-wrap gap-2">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/perfil/${p.id}`}
            className="min-h-[44px] rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition active:scale-95 hover:bg-white/20"
          >
            {p.full_name}
          </Link>
        ))}
        {!filtered.length && (
          <p className="text-sm text-zinc-500">No se encontraron jugadores</p>
        )}
      </div>
    </div>
  );
}
