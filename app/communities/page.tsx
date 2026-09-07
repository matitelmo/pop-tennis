import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAllCommunities, getUserCommunities } from "@/lib/community/context";
import { communityPath } from "@/lib/community/paths";
import { createClient } from "@/lib/supabase/server";

export default async function CommunitiesPage() {
  const communities = await getAllCommunities();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const memberships = user ? await getUserCommunities(user.id) : [];
  const memberSlugs = new Set(memberships.map((m) => m.slug));

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
            <Trophy className="h-9 w-9 text-accent" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-white">Pop Tennis</h1>
          <p className="mt-3 text-lg text-zinc-300">Elegí tu comunidad</p>
        </div>

        <ul className="mt-10 space-y-3">
          {communities.map((c) => (
            <li key={c.id}>
              <Link
                href={communityPath(c.slug, "ranking")}
                className="block rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-accent/40"
              >
                <p className="font-bold text-white">{c.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {memberSlugs.has(c.slug) ? "Ya sos miembro" : "Ver ranking"}
                  {c.settings.requires_subscription ? " · Suscripción para partidos" : " · Gratis"}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3">
          {user ? (
            <Link href={communityPath("wild-on", "perfil")}>
              <Button variant="secondary" className="w-full" size="lg">
                Mi perfil
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button className="w-full" size="lg">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register?community=venice-beach">
                <Button variant="secondary" className="w-full" size="lg">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
