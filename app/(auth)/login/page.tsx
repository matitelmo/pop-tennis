"use client";

import Link from "next/link";
import { useState } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="rounded-3xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-4 text-display">Wild On Pop Tennis</h1>
        <p className="mt-1 text-caption">Ranking de la banda</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Entrando..." : "Ingresar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-caption">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-bold text-accent">
          Registrate
        </Link>
      </p>
    </Card>
  );
}
