import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { BadgeCode } from "@/types/database";

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
            className={`rounded-2xl border p-4 text-center transition ${
              unlocked
                ? "border-lime-400/30 bg-lime-400/10"
                : "border-white/5 bg-white/5 opacity-40 grayscale"
            }`}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <p className="mt-2 text-sm font-bold text-white">{badge.label}</p>
            <p className="mt-1 text-xs text-zinc-400">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}
