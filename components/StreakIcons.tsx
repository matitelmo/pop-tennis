type Props = {
  streak: ("W" | "L")[];
};

export function StreakIcons({ streak }: Props) {
  if (!streak.length) {
    return <p className="text-xs text-zinc-500">Sin partidos</p>;
  }

  return (
    <div className="mt-0.5 flex gap-1">
      {streak.map((result, i) => (
        <span
          key={i}
          className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
            result === "W"
              ? "bg-lime-500/20 text-lime-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
