import type { MatchPointSummary } from "@/lib/match-labels";

type Props = {
  summary: MatchPointSummary;
  compact?: boolean;
};

export function MatchPointContext({ summary, compact = false }: Props) {
  if (compact) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {summary.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-black/20 px-3 py-2.5">
      <p className="text-sm font-bold text-white">{summary.headline}</p>
      <ul className="mt-1.5 space-y-1">
        {summary.details.map((detail) => (
          <li key={detail} className="text-xs text-zinc-400">
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
