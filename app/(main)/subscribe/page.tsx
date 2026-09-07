import { SubscribeCheckout } from "@/components/SubscribeCheckout";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUserProfile } from "@/lib/actions/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  if (hasActiveSubscription(profile)) {
    redirect("/partido");
  }

  const params = await searchParams;

  return (
    <div>
      <AppHeader title="Suscripción" subtitle="Venice Pop Tennis League" />
      {params.success && (
        <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          ¡Pago recibido! Ya podés cargar partidos.
        </p>
      )}
      {params.canceled && (
        <p className="mb-4 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          Pago cancelado. Podés intentar de nuevo cuando quieras.
        </p>
      )}
      <SubscribeCheckout />
      <Link href="/ranking" className="mt-6 block text-center text-sm text-zinc-500">
        ← Volver al ranking
      </Link>
    </div>
  );
}
