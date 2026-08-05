import { cn } from "@/lib/utils";
import { formatTeamName } from "@/lib/match/score-display";
import type { SetScore } from "@/types/database";

type Props = {
  setScores: SetScore[];
  team1Ids: string[];
  team2Ids: string[];
  profileNames: Record<string, string>;
  currentUserId?: string;
  winningTeam?: 1 | 2;
  compact?: boolean;
};

export function MatchScoreBoard({
  setScores,
  team1Ids,
  team2Ids,
  profileNames,
  currentUserId,
  winningTeam,
  compact = false,
}: Props) {
  const team1Name = formatTeamName(team1Ids, profileNames);
  const team2Name = formatTeamName(team2Ids, profileNames);
  const userOnTeam1 = Boolean(currentUserId && team1Ids.includes(currentUserId));
  const userOnTeam2 = Boolean(currentUserId && team2Ids.includes(currentUserId));

  return (
    <div className={cn("rounded-xl bg-surface-glass p-3", compact && "p-2")}>
      <div className="grid grid-cols-[3rem_1fr_1fr] items-end gap-x-3 gap-y-1">
        <span />
        <TeamHeader name={team1Name} isYou={userOnTeam1} align="center" />
        <TeamHeader name={team2Name} isYou={userOnTeam2} align="center" />
        {setScores.map((set, index) => (
          <div key={index} className="contents">
            <span className="text-xs font-medium text-zinc-500">Set {index + 1}</span>
            <ScoreCell value={set.p1} highlight={winningTeam === 1 && set.p1 > set.p2} />
            <ScoreCell value={set.p2} highlight={winningTeam === 2 && set.p2 > set.p1} />
          </div>
        ))}
      </div>
      {winningTeam && (
        <p className="mt-3 text-center text-sm font-semibold text-accent">
          Ganó {winningTeam === 1 ? team1Name : team2Name}
        </p>
      )}
    </div>
  );
}

function TeamHeader({
  name,
  isYou,
  align,
}: {
  name: string;
  isYou: boolean;
  align: "center" | "left";
}) {
  return (
    <div className={cn("min-w-0", align === "center" && "text-center")}>
      <p
        className={cn(
          "truncate text-xs font-bold uppercase tracking-wide",
          isYou ? "text-accent" : "text-zinc-400"
        )}
      >
        {name}
      </p>
      {isYou && <p className="text-[10px] font-bold text-accent">Vos</p>}
    </div>
  );
}

function ScoreCell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <p
      className={cn(
        "text-center font-mono text-xl font-bold text-white",
        highlight && "text-accent"
      )}
    >
      {value}
    </p>
  );
}
