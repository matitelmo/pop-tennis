"use client";

import { useState } from "react";
import Link from "next/link";
import { findPlayersByAvailability, type AvailabilityPlayer } from "@/lib/actions/availability";
import { ChallengeButton } from "@/components/ChallengeButton";
import { ScheduleChip } from "@/components/ScheduleChip";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { getDayLabels, getHourLabels, getSkillLabelLocalized } from "@/lib/i18n/messages";
import { communityPath } from "@/lib/community/paths";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  communitySlug: string;
  hasAvailability: boolean;
  canChallenge: boolean;
};

export function AvailabilityFinder({
  communitySlug,
  hasAvailability,
  canChallenge,
}: Props) {
  const { locale, translate: tr } = useCommunity();
  const days = getDayLabels(locale);
  const hours = getHourLabels(locale);

  const [day, setDay] = useState("fri");
  const [block, setBlock] = useState("18");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [players, setPlayers] = useState<AvailabilityPlayer[]>([]);

  async function search() {
    setLoading(true);
    const result = await findPlayersByAvailability(communitySlug, day, block);
    setPlayers(result.players);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {!hasAvailability && (
        <Card className="border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-zinc-300">{tr("setYourAvailability")}</p>
          <Link href={communityPath(communitySlug, "perfil")} className="mt-3 block">
            <Button size="md" className="w-full">
              {tr("navProfile")}
            </Button>
          </Link>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-sm font-bold text-zinc-400">{tr("selectDay")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {days.map((d) => (
            <ScheduleChip
              key={d.key}
              label={d.label}
              active={day === d.key}
              onClick={() => {
                setDay(d.key);
                setSearched(false);
              }}
              className={cn("min-w-[44px] rounded-full px-3")}
            />
          ))}
        </div>

        <p className="mt-4 text-sm font-bold text-zinc-400">{tr("selectTime")}</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {hours.map((h) => (
            <ScheduleChip
              key={h.key}
              label={h.label}
              active={block === h.key}
              onClick={() => {
                setBlock(h.key);
                setSearched(false);
              }}
            />
          ))}
        </div>

        <Button type="button" className="mt-4 w-full" size="md" disabled={loading} onClick={search}>
          {loading ? tr("sending") : tr("searchPlayers")}
        </Button>
      </Card>

      {searched && players.length === 0 && (
        <Card>
          <p className="text-center text-caption">{tr("noPlayersFound")}</p>
        </Card>
      )}

      {players.length > 0 && (
        <div className="space-y-3">
          {players.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{p.full_name}</p>
                    {p.rank > 0 && (
                      <span className="rounded-full bg-surface-glass px-2 py-0.5 text-xs font-bold text-zinc-400">
                        #{p.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-caption">
                    {getSkillLabelLocalized(p.skill_level, locale)} ·{" "}
                    <span className="font-bold text-accent">{p.rating} pts</span>
                  </p>
                  {p.overlapDays > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {p.overlapDays} {tr("daysInCommon")}
                    </p>
                  )}
                </div>
                {canChallenge && (
                  <ChallengeButton
                    opponentId={p.id}
                    opponentName={p.full_name}
                    size="md"
                    communitySlug={communitySlug}
                  />
                )}
              </div>
              <div className="mt-3 border-t border-border-subtle pt-3">
                {p.phone_number ? (
                  <a
                    href={`tel:${p.phone_number.replace(/\s/g, "")}`}
                    className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-accent hover:underline"
                  >
                    {tr("callOrText")}: {p.phone_number}
                  </a>
                ) : (
                  <p className="text-xs text-zinc-500">{tr("noPhoneOnFile")}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
