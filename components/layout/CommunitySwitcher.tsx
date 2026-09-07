"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { communityPath } from "@/lib/community/paths";
import { cn } from "@/lib/utils";

type CommunityOption = {
  slug: string;
  name: string;
};

type Props = {
  currentSlug: string;
  currentName: string;
  communities: CommunityOption[];
};

export function CommunitySwitcher({ currentSlug, currentName, communities }: Props) {
  const [open, setOpen] = useState(false);

  if (communities.length <= 1) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Comunidad</p>
        <p className="mt-0.5 truncate text-sm font-bold text-white">{currentName}</p>
      </div>
    );
  }

  return (
    <div className="relative px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Comunidad</p>
          <p className="truncate text-sm font-bold text-white">{currentName}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="absolute left-3 right-3 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-surface-elevated py-1 shadow-xl">
          {communities.map((c) => (
            <li key={c.slug}>
              <Link
                href={communityPath(c.slug, "ranking")}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm transition hover:bg-white/5",
                  c.slug === currentSlug ? "font-bold text-accent" : "text-zinc-300"
                )}
              >
                {c.name}
              </Link>
            </li>
          ))}
          <li className="border-t border-white/10">
            <Link
              href="/communities"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Todas las comunidades
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
