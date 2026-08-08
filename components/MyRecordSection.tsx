"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MatchHistoryList } from "@/components/MatchHistoryList";
import { Card } from "@/components/ui/Card";
import type { HistoryItem } from "@/lib/actions/history";

type Props = {
  items: HistoryItem[];
  profileNames: Record<string, string>;
  currentUserId: string;
};

export function MyRecordSection({ items, profileNames, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const wins = items.filter((item) => item.team === "winner" && !item.isPending).length;
  const losses = items.filter((item) => item.team === "loser" && !item.isPending).length;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-border-subtle bg-surface-glass px-4 py-4 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div>
          <h3 className="font-bold text-white">Mi Record</h3>
          <p className="mt-1 text-caption">
            {items.length
              ? `${wins}-${losses} confirmados · ${items.length} partido${items.length > 1 ? "s" : ""}`
              : "Todavía no jugaste partidos"}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <Card className="mt-3 p-3">
          {items.length ? (
            <MatchHistoryList
              items={items}
              profileNames={profileNames}
              currentUserId={currentUserId}
              variant="personal"
            />
          ) : (
            <p className="py-6 text-center text-caption">
              Cuando cargues o confirmes partidos, van a aparecer acá.
            </p>
          )}
        </Card>
      )}
    </section>
  );
}
