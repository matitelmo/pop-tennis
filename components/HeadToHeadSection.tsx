import { getHeadToHead } from "@/lib/actions/history";

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

  if (h2h.wins + h2h.losses === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <h3 className="font-bold text-white">Cara a cara</h3>
        <p className="mt-2 text-sm text-zinc-500">Sin partidos entre ustedes</p>
      </div>
    );
  }

  const streakName =
    h2h.streakHolder === userId ? userName : opponentName;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <h3 className="font-bold text-white">Cara a cara vs {opponentName}</h3>
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
