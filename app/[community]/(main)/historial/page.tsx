import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Swords } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getGroupMatchHistory } from "@/lib/actions/history";
import { getCommunityBySlug } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
import { MatchHistoryList } from "@/components/MatchHistoryList";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ community: string }>;
};

export default async function HistorialPage({ params }: Props) {
  const { community: communitySlug } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?community=${communitySlug}`);

  const { items: history, profileNames } = await getGroupMatchHistory(communitySlug);

  return (
    <div>
      <AppHeader title="Historial" subtitle={`Partidos · ${community.name}`} />

      {history.length === 0 ? (
        <Card className="py-10 text-center">
          <Swords className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-body">Todavía no hay partidos en el historial</p>
          <Link href={communityPath(communitySlug, "partido")} className="mt-4 inline-block">
            <Button size="sm">Cargar primer partido</Button>
          </Link>
        </Card>
      ) : (
        <MatchHistoryList
          items={history}
          profileNames={profileNames}
          currentUserId={profile.id}
          variant="group"
          showEmptyAction={false}
          communitySlug={communitySlug}
        />
      )}
    </div>
  );
}
