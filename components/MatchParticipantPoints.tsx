type Props = {
  ratingChanges: Record<string, number>;
  profileNames: Record<string, string>;
  team1Ids: string[];
  team2Ids: string[];
  compact?: boolean;
};

function formatDelta(delta: number): string {
  return `${delta >= 0 ? "+" : ""}${delta}`;
}

function DeltaText({ delta }: { delta: number | undefined }) {
  if (delta === undefined) {
    return <span className="text-zinc-600">—</span>;
  }

  return (
    <span className={`font-bold tabular-nums ${delta >= 0 ? "text-accent" : "text-danger"}`}>
      {formatDelta(delta)} pts
    </span>
  );
}

function TeamColumn({
  ids,
  label,
  ratingChanges,
  profileNames,
}: {
  ids: string[];
  label: string;
  ratingChanges: Record<string, number>;
  profileNames: Record<string, string>;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="space-y-1">
        {ids.map((id) => (
          <div key={id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-zinc-300">{profileNames[id] ?? "Jugador"}</span>
            <DeltaText delta={ratingChanges[id]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchParticipantPoints({
  ratingChanges,
  profileNames,
  team1Ids,
  team2Ids,
  compact = false,
}: Props) {
  if (!Object.keys(ratingChanges).length) return null;

  if (compact) {
    return (
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {[...team1Ids, ...team2Ids].map((id) => (
          <span key={id} className="text-zinc-400">
            {profileNames[id] ?? "?"}:{" "}
            <span
              className={`font-bold tabular-nums ${
                (ratingChanges[id] ?? 0) >= 0 ? "text-accent" : "text-danger"
              }`}
            >
              {ratingChanges[id] !== undefined ? formatDelta(ratingChanges[id]) : "—"}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-4 border-t border-border-subtle pt-3">
      <TeamColumn
        ids={team1Ids}
        label="Equipo 1 (izq)"
        ratingChanges={ratingChanges}
        profileNames={profileNames}
      />
      <TeamColumn
        ids={team2Ids}
        label="Equipo 2 (der)"
        ratingChanges={ratingChanges}
        profileNames={profileNames}
      />
    </div>
  );
}

export function MatchUserDelta({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  return (
    <span
      className={`font-bold tabular-nums ${delta >= 0 ? "text-accent" : "text-danger"}`}
    >
      {formatDelta(delta)} pts
    </span>
  );
}
