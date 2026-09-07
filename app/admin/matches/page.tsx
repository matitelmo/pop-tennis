import { Suspense } from "react";
import { getAllCommunities } from "@/lib/community/context";
import {
  getAdminMatchContext,
  getAdminMatches,
} from "@/lib/actions/admin/matches";
import { AdminMatchesPageClient } from "@/components/admin/AdminMatchesPageClient";
import type { MatchStatus } from "@/types/database";

type Props = {
  searchParams: Promise<{ status?: string; community?: string }>;
};

export default async function AdminMatchesPage({ searchParams }: Props) {
  const params = await searchParams;
  const communities = await getAllCommunities();
  const status = (params.status as MatchStatus | undefined) ?? undefined;
  const matches = await getAdminMatches({
    communitySlug: params.community,
    status: status ?? "all",
    limit: 50,
  });
  const { profileNames, communitySlugs } = await getAdminMatchContext(matches);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Partidos</h2>
      <Suspense fallback={<p className="text-sm text-zinc-400">Cargando…</p>}>
        <AdminMatchesPageClient
          communities={communities.map((c) => ({ slug: c.slug, name: c.name }))}
          matches={matches}
          profileNames={profileNames}
          communitySlugs={communitySlugs}
        />
      </Suspense>
    </div>
  );
}
