"use client";

import { cn } from "@/lib/utils";

export type SegmentTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: SegmentTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  sticky?: boolean;
};

export function SegmentTabs({ tabs, activeId, onChange, className, sticky }: Props) {
  const activeIndex = tabs.findIndex((t) => t.id === activeId);

  return (
    <div
      role="tablist"
      aria-label="Opciones"
      className={cn(
        "relative flex rounded-2xl border border-border bg-surface-glass p-1",
        sticky && "sticky top-0 z-10 backdrop-blur-lg",
        className
      )}
    >
      <div
        className="absolute inset-y-1 rounded-xl bg-accent transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 8px) / ${tabs.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
        aria-hidden
      />
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 min-h-[44px] flex-1 rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active ? "text-accent-foreground" : "text-zinc-400"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
