"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RosterAdminTable } from "@/components/admin/RosterAdminTable";
import type { RosterPlayer } from "@/types/database";

type Props = {
  communities: { slug: string; name: string }[];
  rosterBySlug: Record<string, RosterPlayer[]>;
};

export function RosterAdminPageClient({ communities, rosterBySlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("community") ?? communities[0]?.slug ?? "wild-on";
  const roster = rosterBySlug[slug] ?? [];

  return (
    <div className="space-y-4">
      <select
        value={slug}
        onChange={(e) => router.push(`/admin/roster?community=${e.target.value}`)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      >
        {communities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <RosterAdminTable communitySlug={slug} roster={roster} />
    </div>
  );
}
