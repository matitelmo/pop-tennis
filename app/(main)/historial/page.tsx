import Link from "next/link";
import { redirect } from "next/navigation";
import { Swords } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getMatchHistory } from "@/lib/actions/history";
import { MatchHistoryList } from "@/components/MatchHistoryList";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function HistorialPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const history = await getMatchHistory(profile.id);

  return (
    <div>
      <AppHeader title="Historial" subtitle="Todos tus partidos" />

      {history.length === 0 ? (
        <Card className="py-10 text-center">
          <Swords className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-body">Todavía no hay partidos en el historial</p>
          <Link href="/partido" className="mt-4 inline-block">
            <Button size="sm">Cargar primer partido</Button>
          </Link>
        </Card>
      ) : (
        <MatchHistoryList items={history} />
      )}
    </div>
  );
}
