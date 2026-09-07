import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAllCommunities, getUserCommunities } from "@/lib/community/context";
import { getIsAdmin } from "@/lib/admin/auth";
import { communityPath } from "@/lib/community/paths";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CommunitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const communities = await getAllCommunities();
  const isAdmin = await getIsAdmin();
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
          <p className="mt-3 text-lg text-zinc-300">
            {isAdmin ? "Elegí cómo querés continuar" : "Elegí tu comunidad"}
          </p>
        </div>

        {isAdmin && (
          <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-5">
            <p className="text-sm font-bold text-accent">Sos administrador</p>
            <p className="mt-1 text-sm text-zinc-300">
              Para editar settings, miembros, partidos o roster usá el panel admin — no la app de
              jugador.
            </p>
            <Link href="/admin" className="mt-4 block">
              <Button className="w-full" size="lg">
                Ir al panel admin
              </Button>
            </Link>
          </div>
        )}

        {params.error === "not-admin" && (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            No tenés permisos de admin. Pedile al owner que configure ADMIN_USER_ID en Vercel.
          </p>
        )}

        <ul className="mt-10 space-y-3">
          {communities.map((c) => (
            <li key={c.id}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="font-bold text-white">{c.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {memberSlugs.has(c.slug) ? "Ya sos miembro" : "Sin membresía"}
                  {c.settings.requires_subscription ? " · Suscripción para partidos" : " · Gratis"}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {isAdmin ? (
                    <>
                      <Link href={`/admin/communities/${c.slug}`}>
                        <Button className="w-full" size="lg">
                          Administrar {c.name}
                        </Button>
                      </Link>
                      <Link href={communityPath(c.slug, "ranking")}>
                        <Button variant="secondary" className="w-full" size="lg">
                          Entrar como jugador
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href={communityPath(c.slug, "ranking")}>
                      <Button className="w-full" size="lg">
                        Ver ranking
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
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
