import { redirect } from "next/navigation";
import { logout, getCurrentUserProfile } from "@/lib/actions/auth";
import { getUserBadges } from "@/lib/actions/history";
import { BadgeGrid } from "@/components/BadgeGrid";
import { StreakIcons } from "@/components/StreakIcons";
import { getLeaderboard } from "@/lib/actions/ranking";
import { getSkillLabel } from "@/lib/constants";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { InviteFriends } from "@/components/InviteFriends";
import { PlayerSearchList } from "@/components/PlayerSearchList";
import { LogOut } from "lucide-react";
import Link from "next/link";

export default async function PerfilPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const badges = await getUserBadges(profile.id);
  const entries = await getLeaderboard();
  const myEntry = entries.find((e) => e.id === profile.id);
  const rank = entries.findIndex((e) => e.id === profile.id) + 1;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mi Perfil</h1>
          <p className="text-sm text-zinc-400">Vitrina de trofeos</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-white active:scale-95"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </header>

      <InviteFriends inviteCode={process.env.NEXT_PUBLIC_GROUP_INVITE_CODE ?? ""} />

      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white ${getAvatarColor(profile.id)}`}
        >
          {getInitials(profile.full_name)}
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">{profile.full_name}</h2>
        <p className="text-sm text-zinc-400">{getSkillLabel(profile.skill_level)}</p>
        <p className="mt-2 text-3xl font-black text-lime-400">{profile.rating} pts</p>
        {rank > 0 && (
          <p className="mt-1 text-sm text-zinc-500">Puesto #{rank}</p>
        )}
        {myEntry && (
          <div className="mt-4 flex justify-center">
            <StreakIcons streak={myEntry.streak} />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-bold text-white">Medallas</h3>
        <BadgeGrid unlockedCodes={badges.map((b) => b.badge_code)} />
      </div>

      <PlayerSearchList
        players={entries.map((e) => ({ id: e.id, full_name: e.full_name }))}
        excludeId={profile.id}
        title="Ver perfil de..."
      />

      <Link
        href="/reglas"
        className="block text-center text-sm text-zinc-500 underline"
      >
        Reglas y ranking
      </Link>
    </div>
  );
}
