import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getUserBadges } from "@/lib/actions/history";
import { getRatingHistory } from "@/lib/actions/rating-history";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getViewablePlayer } from "@/lib/actions/player-profile";
import { getCommunityBySlug } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { AppHeader } from "@/components/AppHeader";
import type { RatingHistoryPoint } from "@/types/database";

type Props = {
  params: Promise<{ community: string; id: string }>;
};

export default async function PerfilAjenoPage({ params }: Props) {
  const { community: communitySlug, id } = await params;
  const community = await getCommunityBySlug(communitySlug);
  if (!community) notFound();

  const [resolved, currentUser, entries] = await Promise.all([
    getViewablePlayer(id),
    getCurrentUserProfile(),
    getLeaderboard({ communitySlug }),
  ]);

  if (!resolved || !currentUser) notFound();

  if (resolved.kind === "redirect") {
    redirect(communityPath(communitySlug, resolved.redirectTo.replace(/^\//, "")));
  }

  const player = resolved.player;

  if (!player.isUnclaimed && currentUser.id === player.id) {
    redirect(communityPath(communitySlug, "perfil"));
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
      <AppHeader
        title={player.full_name}
        backHref={communityPath(communitySlug, "ranking")}
        backLabel="Ranking"
      />

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
        communitySlug={communitySlug}
      />
    </div>
  );
}
