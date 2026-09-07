import { Trophy } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md lg:grid lg:max-w-4xl lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="hidden text-center lg:block lg:text-left">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
            <Trophy className="h-9 w-9 text-accent" />
          </div>
          <h1 className="mt-6 text-4xl font-black text-white">Pop Tennis</h1>
          <p className="mt-4 text-lg text-zinc-300">
            Ranking, partidos y comunidades de pop tennis en un solo lugar.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Unite a tu liga, cargá resultados y seguí tu evolución en el ranking.
          </p>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
