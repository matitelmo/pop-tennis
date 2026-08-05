import { redirect } from "next/navigation";
import Link from "next/link";
import { logout, getCurrentUserProfile } from "@/lib/actions/auth";
import { getUserBadges } from "@/lib/actions/history";
import { getRatingHistory } from "@/lib/actions/rating-history";
import { BadgeGrid } from "@/components/BadgeGrid";
import { GhostBadge } from "@/components/GhostBadge";
import { RatingChart } from "@/components/RatingChart";
import { ProfileRating } from "@/components/ProfileRating";
import { StreakIcons } from "@/components/StreakIcons";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getSkillLabel } from "@/lib/constants";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { ProfileStatsSection } from "@/components/ProfileStatsSection";
import { InviteFriends } from "@/components/InviteFriends";
import { PlayerSearchList } from "@/components/PlayerSearchList";
import { LogOut } from "lucide-react";

export default async function PerfilPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const badges = await getUserBadges(profile.id);
  const ratingHistory = await getRatingHistory(profile.id);
  const entries = await getLeaderboard();
  const myEntry = entries.find((e) => e.id === profile.id);
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Mi Perfil"
        subtitle="Vitrina de trofeos"
        action={
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="min-w-[44px] px-2">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        }
      />

      <InviteFriends inviteCode={process.env.NEXT_PUBLIC_GROUP_INVITE_CODE ?? ""} />

      <Card className="p-6 text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-white ${getAvatarColor(profile.id)}`}
        >
          {getInitials(profile.full_name)}
        </div>
        <h2 className="mt-4 text-title">{profile.full_name}</h2>
        {myEntry?.isGhost && (
          <div className="mt-2 flex justify-center">
            <GhostBadge />
          </div>
        )}
        <p className="text-body">{getSkillLabel(profile.skill_level)}</p>
        <ProfileRating rating={profile.rating} />
        {rank > 0 && <p className="mt-1 text-caption">Puesto #{rank}</p>}
        {myEntry && (
          <div className="mt-4 flex justify-center">
            <StreakIcons streak={myEntry.streak} />
          </div>
        )}
      </Card>

      <RatingChart points={ratingHistory} />

      <ProfileStatsSection userId={profile.id} possessive="tuyo" />

      <div>
        <h3 className="mb-3 font-bold text-white">Medallas</h3>
        <BadgeGrid unlockedCodes={badges.map((b) => b.badge_code)} />
      </div>

      <PlayerSearchList
        players={entries
          .filter((e) => !e.isUnclaimed)
          .map((e) => ({ id: e.id, full_name: e.full_name }))}
        excludeId={profile.id}
        title="Ver perfil de..."
      />

      <Link href="/reglas" className="block text-center text-caption underline">
        Reglas y ranking
      </Link>
    </div>
  );
}
