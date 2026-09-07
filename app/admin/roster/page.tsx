import { Suspense } from "react";
import { getAllCommunities } from "@/lib/community/context";
import { getRosterForCommunity } from "@/lib/actions/admin/roster";
import { RosterAdminPageClient } from "@/components/admin/RosterAdminPageClient";

export default async function AdminRosterPage() {
  const communities = await getAllCommunities();
  const rosterBySlug: Record<string, Awaited<ReturnType<typeof getRosterForCommunity>>> = {};

  await Promise.all(
    communities.map(async (c) => {
      rosterBySlug[c.slug] = await getRosterForCommunity(c.slug);
    })
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Roster</h2>
      <Suspense fallback={<p className="text-sm text-zinc-400">Cargando…</p>}>
        <RosterAdminPageClient
          communities={communities.map((c) => ({ slug: c.slug, name: c.name }))}
          rosterBySlug={rosterBySlug}
        />
      </Suspense>
    </div>
  );
}
