import Link from "next/link";
import { getAllCommunities } from "@/lib/community/context";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function AdminCommunitiesPage() {
  const communities = await getAllCommunities();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Comunidades</h2>
        <Link href="/admin/communities/new">
          <Button size="sm">Nueva</Button>
        </Link>
      </div>
      <ul className="space-y-2">
        {communities.map((c) => (
          <li key={c.id}>
            <Card className="p-4">
              <p className="font-medium text-white">{c.name}</p>
              <p className="text-xs text-zinc-500">/{c.slug}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/communities/${c.slug}`}>
                  <Button size="sm" variant="secondary">
                    Settings
                  </Button>
                </Link>
                <Link href={`/admin/communities/${c.slug}/members`}>
                  <Button size="sm" variant="secondary">
                    Miembros
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
