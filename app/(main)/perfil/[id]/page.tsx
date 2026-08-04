import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getProfile, getUserBadges } from "@/lib/actions/history";
import { getLeaderboard } from "@/lib/actions/ranking";
import { BadgeGrid } from "@/components/BadgeGrid";
import { HeadToHeadSection } from "@/components/HeadToHeadSection";
import { ChallengeButton } from "@/components/ChallengeButton";
import { GhostBadge } from "@/components/GhostBadge";
import { StreakIcons } from "@/components/StreakIcons";
import { getSkillLabel } from "@/lib/constants";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

type Props = {
  params: { id: string };
};

export default async function PerfilAjenoPage({ params }: Props) {
  const [profile, currentUser, badges, entries] = await Promise.all([
    getProfile(params.id),
    getCurrentUserProfile(),
    getUserBadges(params.id),
    getLeaderboard(),
  ]);

  if (!profile || !currentUser) notFound();

  if (currentUser.id === profile.id) {
    redirect("/perfil");
  }

  const entry = entries.find((e) => e.id === profile.id);
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;

  return (
    <div className="space-y-6">
      <Link
        href="/ranking"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-zinc-400"
      >
        <ChevronLeft className="h-4 w-4" /> Ranking
      </Link>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white ${getAvatarColor(profile.id)}`}
        >
          {getInitials(profile.full_name)}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
          {entry?.isGhost && <GhostBadge />}
        </div>
        <p className="text-sm text-zinc-400">{getSkillLabel(profile.skill_level)}</p>
        <p className="mt-2 text-3xl font-black text-lime-400">{profile.rating} pts</p>
        {rank > 0 && <p className="mt-1 text-sm text-zinc-500">Puesto #{rank}</p>}
        {entry && (
          <div className="mt-4 flex justify-center">
            <StreakIcons streak={entry.streak} />
          </div>
        )}
      </div>

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
