import Link from "next/link";
import { BadgeGrid } from "@/components/BadgeGrid";
import { ProfileStatsSection } from "@/components/ProfileStatsSection";
import { HeadToHeadSection } from "@/components/HeadToHeadSection";
import { ChallengeButton } from "@/components/ChallengeButton";
import { GhostBadge } from "@/components/GhostBadge";
import { RatingChart } from "@/components/RatingChart";
import { ProfileRating } from "@/components/ProfileRating";
import { StreakIcons } from "@/components/StreakIcons";
import { PlayerSearchList } from "@/components/PlayerSearchList";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSkillLabel } from "@/lib/constants";
import { getAvatarColor, getInitials } from "@/lib/utils";
import type { ViewablePlayer } from "@/lib/actions/player-profile";
import type { LeaderboardEntry } from "@/lib/actions/ranking";
import type { RatingHistoryPoint } from "@/types/database";
import { communityPath } from "@/lib/community/paths";

type Props = {
  player: ViewablePlayer;
  rank: number;
  entry?: LeaderboardEntry;
  badgeCodes: string[];
  ratingHistory: RatingHistoryPoint[];
  currentUserId: string;
  currentUserName: string;
  browsePlayers?: { id: string; full_name: string }[];
  showPlayerSearch?: boolean;
  communitySlug: string;
};

export function PlayerProfileView({
  player,
  rank,
  entry,
  badgeCodes,
  ratingHistory,
  currentUserId,
  currentUserName,
  browsePlayers,
  showPlayerSearch = false,
  communitySlug,
}: Props) {
  const isOwnProfile = !player.isUnclaimed && player.id === currentUserId;

  return (
    <div className="app-page">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-white ${getAvatarColor(player.id)}`}
            >
              {getInitials(player.full_name)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <h2 className="text-title">{player.full_name}</h2>
              {isOwnProfile && <Badge variant="accent">Vos</Badge>}
              {player.isUnclaimed && (
                <Badge variant="default" title="Todavía no se registró en la app">
                  Sin reclamar
                </Badge>
              )}
              {entry?.isGhost && <GhostBadge compact />}
            </div>
            <p className="text-body">{getSkillLabel(player.skill_level)}</p>
            <ProfileRating rating={player.rating} />
            {rank > 0 && <p className="mt-1 text-caption">Puesto #{rank}</p>}
            {entry && !player.isUnclaimed && (
              <div className="mt-4 flex justify-center">
                <StreakIcons streak={entry.streak} />
              </div>
            )}
            {player.isUnclaimed && (
              <p className="mt-4 text-caption">
                Este jugador está en el roster pero todavía no tiene cuenta. Cuando se registre,
                acá van a aparecer sus partidos, medallas y estadísticas.
              </p>
            )}
          </Card>

          <RatingChart
            points={ratingHistory}
            playerName={isOwnProfile ? undefined : player.full_name}
          />
        </div>

        <div className="space-y-6">
          <ProfileStatsSection
            userId={player.id}
            possessive={isOwnProfile ? "tuyo" : "ajeno"}
            communitySlug={communitySlug}
          />

          {!player.isUnclaimed && !isOwnProfile && (
            <>
              <ChallengeButton opponentId={player.id} opponentName={player.full_name} />
              <HeadToHeadSection
                userId={currentUserId}
                opponentId={player.id}
                userName={currentUserName}
                opponentName={player.full_name}
              />
            </>
          )}

          <div>
            <h3 className="mb-3 font-bold text-white">Medallas</h3>
            {player.isUnclaimed ? (
              <p className="mb-3 text-caption">
                Sin medallas todavía — hace falta que el jugador se registre y juegue partidos.
              </p>
            ) : null}
            <BadgeGrid unlockedCodes={badgeCodes} />
          </div>

          {showPlayerSearch && browsePlayers && browsePlayers.length > 0 && (
            <PlayerSearchList
              players={browsePlayers}
              excludeId={isOwnProfile ? player.id : currentUserId}
              title="Ver perfil de..."
              communitySlug={communitySlug}
            />
          )}

          <Link
            href={communityPath(communitySlug, "reglas")}
            className="block text-center text-caption underline"
          >
            Reglas y ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
