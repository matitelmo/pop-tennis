import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getMatchHistory } from "@/lib/actions/history";
import { MatchHistoryList } from "@/components/MatchHistoryList";

export default async function HistorialPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const history = await getMatchHistory(profile.id);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Historial</h1>
        <p className="text-sm text-zinc-400">Todos tus partidos</p>
      </header>
      <MatchHistoryList items={history} />
    </div>
  );
}
