import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { BadgeCode } from "@/types/database";
import { cn } from "@/lib/utils";

const LEGACY_BADGE_MAP: Record<string, { label: string; emoji: string; description: string }> = {
  papa_del_grupo: BADGE_DEFINITIONS.papa_de_la_banda,
  inviolable: BADGE_DEFINITIONS.zapatero,
  lomo_de_metal: BADGE_DEFINITIONS.viernes_flex,
  paseo_en_coche: BADGE_DEFINITIONS.zapatero,
};

type Props = {
  unlockedCodes: string[];
};

export function BadgeGrid({ unlockedCodes }: Props) {
  const codes = Object.keys(BADGE_DEFINITIONS) as BadgeCode[];

  return (
    <div className="grid grid-cols-2 gap-3">
      {codes.map((code) => {
        const badge = BADGE_DEFINITIONS[code];
        const unlocked = unlockedCodes.includes(code);
        return (
          <div
            key={code}
            className={cn(
              "relative rounded-2xl border p-4 text-center transition",
              unlocked
                ? "border-accent/30 bg-accent-muted"
                : "border-border-subtle bg-surface-glass opacity-50"
            )}
            title={unlocked ? undefined : "Todavía no desbloqueada"}
          >
            {!unlocked && (
              <span className="absolute right-2 top-2 text-xs font-bold text-zinc-600">?</span>
            )}
            <span className={cn("text-3xl", !unlocked && "grayscale")}>{badge.emoji}</span>
            <p className={cn("mt-2 text-sm font-bold", unlocked ? "text-white" : "text-zinc-500")}>
              {badge.label}
            </p>
            <p className="mt-1 text-caption">{badge.description}</p>
          </div>
        );
      })}
      {unlockedCodes
        .filter((c) => !(c in BADGE_DEFINITIONS) && c in LEGACY_BADGE_MAP)
        .map((code) => {
          const badge = LEGACY_BADGE_MAP[code];
          return (
            <div
              key={code}
              className="rounded-2xl border border-accent/30 bg-accent-muted p-4 text-center"
            >
              <span className="text-3xl">{badge.emoji}</span>
              <p className="mt-2 text-sm font-bold text-white">{badge.label}</p>
              <p className="mt-1 text-caption">{badge.description}</p>
            </div>
          );
        })}
    </div>
  );
}
