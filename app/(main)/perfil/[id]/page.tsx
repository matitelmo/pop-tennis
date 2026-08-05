import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getUserBadges } from "@/lib/actions/history";
import { getRatingHistory } from "@/lib/actions/rating-history";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getViewablePlayer } from "@/lib/actions/player-profile";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { AppHeader } from "@/components/AppHeader";
import type { RatingHistoryPoint } from "@/types/database";

type Props = {
  params: { id: string };
};

export default async function PerfilAjenoPage({ params }: Props) {
  const [resolved, currentUser, entries] = await Promise.all([
    getViewablePlayer(params.id),
    getCurrentUserProfile(),
    getLeaderboard(),
  ]);

  if (!resolved || !currentUser) notFound();

  if (resolved.kind === "redirect") {
    redirect(resolved.redirectTo);
  }

  const player = resolved.player;

  if (!player.isUnclaimed && currentUser.id === player.id) {
    redirect("/perfil");
  }

  const entry = entries.find((e) => e.id === player.id);
  const rank = entries.findIndex((e) => e.id === player.id) + 1;

  const [badges, ratingHistory] = await Promise.all([
    player.isUnclaimed ? Promise.resolve([]) : getUserBadges(player.id),
    player.isUnclaimed
      ? Promise.resolve<RatingHistoryPoint[]>([
          { date: player.created_at, rating: player.base_rating },
        ])
      : getRatingHistory(player.id),
  ]);

  const browsePlayers = entries.map((e) => ({ id: e.id, full_name: e.full_name }));

  return (
    <div className="space-y-6">
      <AppHeader title={player.full_name} backHref="/ranking" backLabel="Ranking" />

      <PlayerProfileView
        player={player}
        rank={rank}
        entry={entry}
        badgeCodes={badges.map((b) => b.badge_code)}
        ratingHistory={ratingHistory}
        currentUserId={currentUser.id}
        currentUserName={currentUser.full_name}
        browsePlayers={browsePlayers}
        showPlayerSearch
      />
    </div>
  );
}
