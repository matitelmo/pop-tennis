"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityItem } from "@/lib/actions/activity";

type Props = {
  items: ActivityItem[];
  showHeader?: boolean;
};

export function ActivityFeed({ items, showHeader = true }: Props) {
  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">Sin actividad reciente</p>
    );
  }

  return (
    <section className={showHeader ? "mt-6" : ""}>
      {showHeader && (
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
          Actividad reciente
        </h2>
      )}
      <div className="space-y-2">
        {items.map((item) => {
          const inner = (
            <>
              {item.type === "badge" && (
                <span className="text-xl">{item.emoji}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200">{item.summary}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatRelativeTime(item.created_at)}
                </p>
              </div>
            </>
          );

          if (item.type === "badge") {
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/perfil/${item.userId}`}
                className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition active:scale-[0.99] hover:bg-white/10"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
