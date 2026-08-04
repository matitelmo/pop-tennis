import { getHeadToHead } from "@/lib/actions/history";
import { getPaternidadStatus } from "@/lib/paternidad";

type Props = {
  userId: string;
  opponentId: string;
  userName: string;
  opponentName: string;
};

export async function HeadToHeadSection({
  userId,
  opponentId,
  userName,
  opponentName,
}: Props) {
  const h2h = await getHeadToHead(userId, opponentId);
  const paternidad = getPaternidadStatus(h2h.wins, h2h.losses, opponentName);

  if (h2h.wins + h2h.losses === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <h3 className="font-bold text-white">Cara a cara</h3>
        <p className="mt-2 text-sm text-zinc-500">{paternidad.copy}</p>
      </div>
    );
  }

  const streakName = h2h.streakHolder === userId ? userName : opponentName;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <h3 className="font-bold text-white">Cara a cara vs {opponentName}</h3>

      {paternidad.type === "dominancia" && (
        <div className="mt-3 rounded-xl bg-lime-400/10 px-3 py-2">
          <p className="text-sm font-bold text-lime-400">
            {paternidad.badge} · {paternidad.label}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{paternidad.copy}</p>
        </div>
      )}
      {paternidad.type === "rivalidad" && (
        <div className="mt-3 rounded-xl bg-orange-500/10 px-3 py-2">
          <p className="text-sm font-bold text-orange-400">{paternidad.badge}</p>
          <p className="mt-1 text-xs text-zinc-400">{paternidad.copy}</p>
        </div>
      )}
      {paternidad.type === "desfavorable" && (
        <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2">
          <p className="text-sm font-bold text-red-400">{paternidad.copy}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-black text-lime-400">{h2h.wins}</p>
          <p className="text-xs text-zinc-500">Victorias</p>
        </div>
        <div>
          <p className="text-2xl font-black text-red-400">{h2h.losses}</p>
          <p className="text-xs text-zinc-500">Derrotas</p>
        </div>
        <div>
          <p
            className={`text-2xl font-black ${
              h2h.gameDiff >= 0 ? "text-lime-400" : "text-red-400"
            }`}
          >
            {h2h.gameDiff >= 0 ? "+" : ""}
            {h2h.gameDiff}
          </p>
          <p className="text-xs text-zinc-500">Games</p>
        </div>
      </div>
      {h2h.streak >= 2 && (
        <p className="mt-4 text-center text-sm text-zinc-300">
          🔥 {streakName} lleva {h2h.streak} seguidos
        </p>
      )}
    </div>
  );
}
