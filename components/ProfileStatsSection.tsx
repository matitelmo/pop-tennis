import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getProfileStats } from "@/lib/actions/profile-stats";

type Props = {
  userId: string;
  possessive?: "tuyo" | "ajeno";
};

function RecordLine({ wins, losses }: { wins: number; losses: number }) {
  return (
    <span className="text-caption">
      {wins}-{losses}
    </span>
  );
}

function PlayerLink({
  id,
  name,
  suffix,
}: {
  id: string;
  name: string;
  suffix?: ReactNode;
}) {
  return (
    <Link
      href={`/perfil/${id}`}
      className="flex items-center justify-between gap-2 rounded-xl bg-surface-glass px-3 py-2 transition active:opacity-80"
    >
      <span className="truncate font-medium text-white">{name}</span>
      {suffix}
    </Link>
  );
}

export async function ProfileStatsSection({ userId, possessive = "ajeno" }: Props) {
  const stats = await getProfileStats(userId);
  const isOwn = possessive === "tuyo";

  if (stats.totalConfirmedMatches === 0) {
    return (
      <Card>
        <h3 className="font-bold text-white">Estadísticas</h3>
        <p className="mt-2 text-caption">
          Todavía no hay partidos confirmados para armar estadísticas.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-bold text-white">Estadísticas</h3>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? "Con quién más jugaste" : "Con quién más jugó"}
        </p>
        {stats.mostPlayedOpponent ? (
          <div className="mt-2">
            <PlayerLink
              id={stats.mostPlayedOpponent.id}
              name={stats.mostPlayedOpponent.full_name}
              suffix={
                <RecordLine
                  wins={stats.mostPlayedOpponent.wins}
                  losses={stats.mostPlayedOpponent.losses}
                />
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-caption">Sin rivales todavía.</p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? "Tus hijos" : "Sus hijos"}
        </p>
        {stats.hijos.length ? (
          <div className="mt-2 space-y-2">
            {stats.hijos.map((h) => (
              <PlayerLink
                key={h.id}
                id={h.id}
                name={h.full_name}
                suffix={
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">👑 Hijo</Badge>
                    <RecordLine wins={h.wins} losses={h.losses} />
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-caption">
            {isOwn
              ? "Todavía no tenés paternidad clara con nadie (saldo +3)."
              : "Todavía no tiene hijos en la banda (saldo +3)."}
          </p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? "Tus padres" : "Sus padres"}
        </p>
        {stats.padres.length ? (
          <div className="mt-2 space-y-2">
            {stats.padres.map((p) => (
              <PlayerLink
                key={p.id}
                id={p.id}
                name={p.full_name}
                suffix={
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">{isOwn ? "Te domina" : "Lo domina"}</Badge>
                    <RecordLine wins={p.wins} losses={p.losses} />
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-caption">
            {isOwn
              ? "Nadie te tiene de hijo todavía."
              : "Nadie lo tiene de hijo todavía."}
          </p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          Compañero favorito
        </p>
        {stats.favoritePartner ? (
          <div className="mt-2">
            <PlayerLink
              id={stats.favoritePartner.id}
              name={stats.favoritePartner.full_name}
              suffix={
                <span className="text-caption">
                  {stats.favoritePartner.matches} partidos · {stats.favoritePartner.winRate}% W
                </span>
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-caption">Sin pareja de dobles todavía.</p>
        )}
      </Card>
    </section>
  );
}
