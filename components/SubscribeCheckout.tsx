"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { communityPath } from "@/lib/community/paths";

type Props = {
  communitySlug: string;
};

export function SubscribeCheckout({ communitySlug }: Props) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const router = useRouter();

  async function checkout(plan: "monthly" | "annual") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, communitySlug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-accent/30 p-6">
        <h2 className="text-xl font-black text-white">Unite a la liga</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Para cargar partidos y desafiar rivales necesitás suscripción activa.
        </p>
        <div className="mt-6 space-y-3">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={loading !== null}
            onClick={() => checkout("monthly")}
          >
            {loading === "monthly" ? "Redirigiendo..." : "$10 / mes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            disabled={loading !== null}
            onClick={() => checkout("annual")}
          >
            {loading === "annual" ? "Redirigiendo..." : "$60 / año (ahorrá 50%)"}
          </Button>
        </div>
      </Card>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => router.push(communityPath(communitySlug, "ranking"))}
      >
        Ver ranking gratis
      </Button>
    </div>
  );
}
