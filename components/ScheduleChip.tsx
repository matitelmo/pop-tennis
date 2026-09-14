"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
};

export function ScheduleChip({ label, active, onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[44px] rounded-lg px-2 text-xs font-bold leading-tight transition active:scale-[0.98]",
        active ? "bg-accent text-accent-foreground" : "bg-surface-glass text-zinc-400",
        className
      )}
    >
      {label}
    </button>
  );
}
