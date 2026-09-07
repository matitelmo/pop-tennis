import Link from "next/link";
import { getAllCommunities } from "@/lib/community/context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { communityPath } from "@/lib/community/paths";

export default async function AdminCommunitiesPage() {
  const communities = await getAllCommunities();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Comunidades</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Elegí una comunidad para administrar settings, miembros, partidos y roster.
          </p>
        </div>
        <Link href="/admin/communities/new">
          <Button size="sm">Nueva</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {communities.map((c) => (
          <li key={c.id}>
            <Card className="overflow-hidden p-0">
              <Link
                href={`/admin/communities/${c.slug}`}
                className="block p-4 transition hover:bg-white/5"
              >
                <p className="font-medium text-white">{c.name}</p>
                <p className="mt-1 text-xs text-zinc-500">/{c.slug}</p>
                <p className="mt-2 text-sm text-accent">Administrar →</p>
              </Link>
              <div className="flex gap-2 border-t border-white/10 px-4 py-3">
                <Link href={`/admin/communities/${c.slug}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    Configuración
                  </Button>
                </Link>
                <Link href={`/admin/communities/${c.slug}/members`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    Miembros
                  </Button>
                </Link>
                <Link href={communityPath(c.slug, "ranking")} className="flex-1">
                  <Button size="sm" variant="ghost" className="w-full">
                    Ver app
                  </Button>
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
