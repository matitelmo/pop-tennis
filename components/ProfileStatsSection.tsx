import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getProfileStats } from "@/lib/actions/profile-stats";
import { communityPath } from "@/lib/community/paths";
import type { CommunityLocale } from "@/lib/community/locale";
import { t } from "@/lib/i18n/messages";

type Props = {
  userId: string;
  possessive?: "tuyo" | "ajeno";
  communitySlug: string;
  locale?: CommunityLocale;
};

function RecordLine({ wins, losses }: { wins: number; losses: number }) {
  return (
    <span className="text-caption">
      {wins}-{losses}
    </span>
  );
}

function PlayerLink({
  id,
  name,
  suffix,
  communitySlug,
}: {
  id: string;
  name: string;
  suffix?: ReactNode;
  communitySlug: string;
}) {
  return (
    <Link
      href={communityPath(communitySlug, `perfil/${id}`)}
      className="flex items-center justify-between gap-2 rounded-xl bg-surface-glass px-3 py-2 transition active:opacity-80"
    >
      <span className="truncate font-medium text-white">{name}</span>
      {suffix}
    </Link>
  );
}

export async function ProfileStatsSection({
  userId,
  possessive = "ajeno",
  communitySlug,
  locale = "es",
}: Props) {
  const stats = await getProfileStats(userId);
  const isOwn = possessive === "tuyo";

  if (stats.totalConfirmedMatches === 0) {
    return (
      <Card>
        <h3 className="font-bold text-white">{t(locale, "statsTitle")}</h3>
        <p className="mt-2 text-caption">{t(locale, "statsNoMatches")}</p>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-bold text-white">{t(locale, "statsTitle")}</h3>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? t(locale, "statsMostPlayedOwn") : t(locale, "statsMostPlayedOther")}
        </p>
        {stats.mostPlayedOpponent ? (
          <div className="mt-2">
            <PlayerLink
              id={stats.mostPlayedOpponent.id}
              name={stats.mostPlayedOpponent.full_name}
              communitySlug={communitySlug}
              suffix={
                <RecordLine
                  wins={stats.mostPlayedOpponent.wins}
                  losses={stats.mostPlayedOpponent.losses}
                />
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-caption">{t(locale, "statsNoOpponentsYet")}</p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? t(locale, "statsHijosOwn") : t(locale, "statsHijosOther")}
        </p>
        {stats.hijos.length ? (
          <div className="mt-2 space-y-2">
            {stats.hijos.map((h) => (
              <PlayerLink
                key={h.id}
                id={h.id}
                name={h.full_name}
                communitySlug={communitySlug}
                suffix={
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{t(locale, "statsHijoBadge")}</Badge>
                    <RecordLine wins={h.wins} losses={h.losses} />
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-caption">
            {isOwn ? t(locale, "statsNoHijosOwn") : t(locale, "statsNoHijosOther")}
          </p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {isOwn ? t(locale, "statsPadresOwn") : t(locale, "statsPadresOther")}
        </p>
        {stats.padres.length ? (
          <div className="mt-2 space-y-2">
            {stats.padres.map((p) => (
              <PlayerLink
                key={p.id}
                id={p.id}
                name={p.full_name}
                communitySlug={communitySlug}
                suffix={
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">
                      {isOwn ? t(locale, "statsDominatesYou") : t(locale, "statsDominatesThem")}
                    </Badge>
                    <RecordLine wins={p.wins} losses={p.losses} />
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-caption">
            {isOwn ? t(locale, "statsNoPadresOwn") : t(locale, "statsNoPadresOther")}
          </p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {t(locale, "statsFavoritePartner")}
        </p>
        {stats.favoritePartner ? (
          <div className="mt-2">
            <PlayerLink
              id={stats.favoritePartner.id}
              name={stats.favoritePartner.full_name}
              communitySlug={communitySlug}
              suffix={
                <span className="text-caption">
                  {stats.favoritePartner.matches} {t(locale, "statsPartnerRecord")} ·{" "}
                  {stats.favoritePartner.winRate}% W
                </span>
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-caption">{t(locale, "statsNoPartnerYet")}</p>
        )}
      </Card>
    </section>
  );
}
