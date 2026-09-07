"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminMatchList } from "@/components/admin/AdminMatchList";
import type { Match, MatchStatus } from "@/types/database";

type Props = {
  communities: { slug: string; name: string }[];
  matches: Match[];
  profileNames: Record<string, string>;
  communitySlugs: Record<string, string>;
};

const STATUSES: (MatchStatus | "all")[] = [
  "all",
  "pending",
  "counter_proposed",
  "disputed",
  "confirmed",
];

export function AdminMatchesPageClient({
  communities,
  matches,
  profileNames,
  communitySlugs,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") ?? "all") as MatchStatus | "all";
  const community = searchParams.get("community") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/matches?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={community}
          onChange={(e) => updateParam("community", e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">Todas las comunidades</option>
          {communities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value === "all" ? "" : e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s === "all" ? "" : s}>
              {s === "all" ? "Todos los estados" : s}
            </option>
          ))}
        </select>
      </div>
      <AdminMatchList
        matches={matches}
        profileNames={profileNames}
        communitySlugs={communitySlugs}
      />
    </div>
  );
}
