"use client";

import { useState } from "react";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { BadgeCode } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const LEGACY_BADGE_MAP: Record<
  string,
  { label: string; emoji: string; description: string; story?: string }
> = {
  el_yacare: BADGE_DEFINITIONS.pequeno_charles,
  zapatero: BADGE_DEFINITIONS.gabo_moreti,
  inviolable: BADGE_DEFINITIONS.gabo_moreti,
  paseo_en_coche: BADGE_DEFINITIONS.gabo_moreti,
  caza_gigantes: BADGE_DEFINITIONS.sorpresa_sauna,
  papa_de_la_banda: BADGE_DEFINITIONS.el_padre,
  papa_del_grupo: BADGE_DEFINITIONS.el_padre,
  viernes_flex: BADGE_DEFINITIONS.fede_gorrisen,
  lomo_de_metal: BADGE_DEFINITIONS.fede_gorrisen,
};

type BadgeView = {
  code: string;
  label: string;
  emoji: string;
  description: string;
  story?: string;
  unlocked: boolean;
};

type Props = {
  unlockedCodes: string[];
};

export function BadgeGrid({ unlockedCodes }: Props) {
  const [selected, setSelected] = useState<BadgeView | null>(null);
  const codes = Object.keys(BADGE_DEFINITIONS) as BadgeCode[];

  const badges: BadgeView[] = [
    ...codes.map((code) => {
      const badge = BADGE_DEFINITIONS[code];
      return {
        code,
        label: badge.label,
        emoji: badge.emoji,
        description: badge.description,
        story: badge.story,
        unlocked: unlockedCodes.includes(code),
      };
    }),
    ...unlockedCodes
      .filter((code) => !(code in BADGE_DEFINITIONS) && code in LEGACY_BADGE_MAP)
      .map((code) => {
        const badge = LEGACY_BADGE_MAP[code];
        return {
          code,
          label: badge.label,
          emoji: badge.emoji,
          description: badge.description,
          story: badge.story,
          unlocked: true,
        };
      }),
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge) => (
          <button
            key={badge.code}
            type="button"
            onClick={() => setSelected(badge)}
            className={cn(
              "relative rounded-2xl border p-4 text-center transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              badge.unlocked
                ? "border-accent/30 bg-accent-muted"
                : "border-border-subtle bg-surface-glass opacity-50"
            )}
          >
            {!badge.unlocked && (
              <span className="absolute right-2 top-2 text-xs font-bold text-zinc-600">?</span>
            )}
            <span className={cn("text-3xl", !badge.unlocked && "grayscale")}>{badge.emoji}</span>
            <p
              className={cn(
                "mt-2 text-sm font-bold",
                badge.unlocked ? "text-white" : "text-zinc-500"
              )}
            >
              {badge.label}
            </p>
            <p className="mt-1 text-caption">{badge.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setSelected(null)}
        >
          <Card
            variant="elevated"
            className="w-full max-w-sm animate-slide-up-in rounded-3xl p-6 sm:animate-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <span className="text-5xl">{selected.emoji}</span>
              <h3 className="mt-3 text-xl font-black text-white">{selected.label}</h3>
              <p className="mt-2 text-sm text-zinc-400">{selected.description}</p>
            </div>
            {selected.story && (
              <p className="mt-4 rounded-2xl bg-surface-glass px-4 py-3 text-sm leading-relaxed text-zinc-200">
                {selected.story}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              className="mt-6 w-full"
              onClick={() => setSelected(null)}
            >
              Cerrar
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
