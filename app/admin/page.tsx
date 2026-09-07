import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getAllCommunities } from "@/lib/community/context";
import { createServiceClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const admin = createServiceClient();
  const communities = await getAllCommunities();

  const [{ count: disputedCount }, { count: pendingCount }, { data: rosterRows }] =
    await Promise.all([
      admin.from("matches").select("*", { count: "exact", head: true }).eq("status", "disputed"),
      admin
        .from("matches")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "counter_proposed"]),
      admin.from("roster_players").select("id, claimed_by"),
    ]);

  const unclaimedRoster = (rosterRows ?? []).filter((r) => !r.claimed_by).length;

  const stats = [
    { label: "Comunidades", value: communities.length, href: "/admin/communities" },
    { label: "Disputas", value: disputedCount ?? 0, href: "/admin/disputes" },
    { label: "Pendientes", value: pendingCount ?? 0, href: "/admin/matches?status=pending" },
    { label: "Roster libre", value: unclaimedRoster, href: "/admin/roster" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 transition hover:border-accent/40">
              <p className="text-xs uppercase text-zinc-500">{s.label}</p>
              <p className="mt-1 text-3xl font-black text-white">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-4">
        <p className="text-sm font-medium text-white">Accesos rápidos</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/admin/communities/new" className="text-accent hover:underline">
              Crear comunidad
            </Link>
          </li>
          <li>
            <Link href="/admin/communities/wild-on/members" className="text-accent hover:underline">
              Miembros Wild On
            </Link>
          </li>
          <li>
            <Link
              href="/admin/communities/venice-beach/members"
              className="text-accent hover:underline"
            >
              Miembros Venice Beach
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
