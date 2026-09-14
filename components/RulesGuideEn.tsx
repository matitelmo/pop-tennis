import {
  DECAY_GRACE_DAYS,
  DECAY_POINTS_PER_WEEK,
  FORMAT_MULTIPLIERS,
  GHOST_INACTIVE_DAYS,
  MIN_RATING,
  SKILL_LEVELS,
} from "@/lib/constants";
import { BADGE_DEFINITIONS_EN } from "@/lib/i18n/badges";

function Section({
  title,
  children,
  emoji,
}: {
  title: string;
  children: React.ReactNode;
  emoji?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        {emoji && <span>{emoji}</span>}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300">{children}</div>
    </section>
  );
}

function MultiplierRow({
  label,
  detail,
  multiplier,
  highlight,
}: {
  label: string;
  detail: string;
  multiplier: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
        highlight ? "border border-lime-400/20 bg-lime-400/10" : "bg-black/20"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{label}</p>
        <p className="text-xs text-zinc-400">{detail}</p>
      </div>
      <span className={`shrink-0 text-lg font-black ${highlight ? "text-lime-400" : "text-zinc-200"}`}>
        {multiplier}
      </span>
    </div>
  );
}

export function RulesGuideEn({ showBadges = true }: { showBadges?: boolean }) {
  return (
    <div className="max-w-2xl space-y-4 pb-4">
      <Section title="How it works" emoji="🎾">
        <p>
          Every player has a rating (<strong className="text-lime-400">Elo</strong>). Win and
          you gain points; lose and you drop. How much moves depends on{" "}
          <strong className="text-white">who you played</strong>,{" "}
          <strong className="text-white">match format</strong>, and{" "}
          <strong className="text-white">how dominant the score was</strong>.
        </p>
      </Section>

      <Section title="Starting ratings" emoji="🚀">
        <p>Pick your level at signup:</p>
        <div className="grid grid-cols-2 gap-2">
          {SKILL_LEVELS.map((level) => (
            <div key={level.value} className="rounded-xl bg-black/20 px-3 py-2 text-center">
              <p className="font-semibold capitalize text-white">{level.value}</p>
              <p className="font-bold text-lime-400">{level.rating} pts</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Inactivity can pull you below your start, but ratings never drop below {MIN_RATING} pts.
        </p>
      </Section>

      <Section title="Match calculation" emoji="🧮">
        <div id="calculo" className="scroll-mt-24" />
        <p>
          Before you save a match, the app shows{" "}
          <strong className="text-white">exactly how many points each player would gain or lose</strong>.
        </p>
        <div className="space-y-2">
          <MultiplierRow
            label="Opponent strength"
            detail="Beat someone better = big gain. Beat someone lower = small gain."
            multiplier="★★★"
            highlight
          />
          <MultiplierRow
            label="Format"
            detail="Singles and Bo5 weigh a bit more than doubles or Bo3"
            multiplier="★★"
          />
          <MultiplierRow
            label="Straight sets"
            detail="2-0 in Bo3 or 3-0 in Bo5 = bonus"
            multiplier="★"
          />
        </div>
      </Section>

      <Section title="Format multipliers" emoji="⚡">
        <div className="space-y-2">
          <MultiplierRow label="Singles · Best of 5" detail="1v1 Bo5" multiplier={`×${FORMAT_MULTIPLIERS["1v1_bo5"]}`} highlight />
          <MultiplierRow label="Singles · Best of 3" detail="1v1 Bo3" multiplier={`×${FORMAT_MULTIPLIERS["1v1_bo3"]}`} />
          <MultiplierRow label="Doubles · Best of 5" detail="2v2 Bo5" multiplier={`×${FORMAT_MULTIPLIERS["2v2_bo5"]}`} />
          <MultiplierRow label="Doubles · Best of 3" detail="2v2 Bo3" multiplier={`×${FORMAT_MULTIPLIERS["2v2_bo3"]}`} />
        </div>
      </Section>

      <Section title="Inactive players 👻" emoji="😴">
        <p>
          After <strong className="text-white">{GHOST_INACTIVE_DAYS} days</strong> without a logged
          match, you&apos;re marked inactive and lose{" "}
          <strong className="text-red-400">{DECAY_POINTS_PER_WEEK} pts</strong> per week after a{" "}
          {DECAY_GRACE_DAYS}-day grace period (floor: {MIN_RATING} pts).
        </p>
      </Section>

      {showBadges && (
        <Section title="League badges" emoji="🏅">
          <div className="space-y-2">
            {Object.values(BADGE_DEFINITIONS_EN).map((badge) => (
              <div key={badge.label} className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-2.5">
                <span className="text-2xl">{badge.emoji}</span>
                <div>
                  <p className="font-semibold text-white">{badge.label}</p>
                  <p className="text-xs text-zinc-400">{badge.description}</p>
                  <p className="mt-1 text-xs italic text-zinc-500">{badge.story}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Ranking views" emoji="📊">
        <ul className="list-inside list-disc space-y-2 text-zinc-400">
          <li>Only players with at least one confirmed match appear.</li>
          <li>
            <strong className="text-zinc-200">All-time:</strong> sorted by current rating.
          </li>
          <li>
            <strong className="text-zinc-200">Quarterly:</strong> points gained this quarter.
          </li>
          <li>
            Streak shows your last 5 results:{" "}
            <span className="font-bold text-lime-400">W</span> /{" "}
            <span className="font-bold text-red-400">L</span>.
          </li>
        </ul>
      </Section>
    </div>
  );
}
