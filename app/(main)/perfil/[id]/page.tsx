import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getProfile, getUserBadges } from "@/lib/actions/history";
import { getRatingHistory } from "@/lib/actions/rating-history";
import { getLeaderboard } from "@/lib/actions/ranking";
import { BadgeGrid } from "@/components/BadgeGrid";
import { HeadToHeadSection } from "@/components/HeadToHeadSection";
import { ChallengeButton } from "@/components/ChallengeButton";
import { GhostBadge } from "@/components/GhostBadge";
import { RatingChart } from "@/components/RatingChart";
import { ProfileRating } from "@/components/ProfileRating";
import { StreakIcons } from "@/components/StreakIcons";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { getSkillLabel } from "@/lib/constants";
import { getAvatarColor, getInitials } from "@/lib/utils";

type Props = {
  params: { id: string };
};

export default async function PerfilAjenoPage({ params }: Props) {
  const [profile, currentUser, badges, entries, ratingHistory] = await Promise.all([
    getProfile(params.id),
    getCurrentUserProfile(),
    getUserBadges(params.id),
    getLeaderboard(),
    getRatingHistory(params.id),
  ]);

  if (!profile || !currentUser) notFound();

  if (currentUser.id === profile.id) {
    redirect("/perfil");
  }

  const entry = entries.find((e) => e.id === profile.id);
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;

  return (
    <div className="space-y-6">
      <AppHeader title={profile.full_name} backHref="/ranking" backLabel="Ranking" />

      <Card className="p-6 text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-white ${getAvatarColor(profile.id)}`}
        >
          {getInitials(profile.full_name)}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <h2 className="text-title">{profile.full_name}</h2>
          {entry?.isGhost && <GhostBadge compact />}
        </div>
        <p className="text-body">{getSkillLabel(profile.skill_level)}</p>
        <ProfileRating rating={profile.rating} />
        {rank > 0 && <p className="mt-1 text-caption">Puesto #{rank}</p>}
        {entry && (
          <div className="mt-4 flex justify-center">
            <StreakIcons streak={entry.streak} />
          </div>
        )}
      </Card>

      <RatingChart points={ratingHistory} playerName={profile.full_name} />

      <ChallengeButton opponentName={profile.full_name} />

      <HeadToHeadSection
        userId={currentUser.id}
        opponentId={profile.id}
        userName={currentUser.full_name}
        opponentName={profile.full_name}
      />

      <div>
        <h3 className="mb-3 font-bold text-white">Medallas</h3>
        <BadgeGrid unlockedCodes={badges.map((b) => b.badge_code)} />
      </div>
    </div>
  );
}
