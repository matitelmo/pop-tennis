"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { register } from "@/lib/actions/auth";
import { SKILL_LEVELS } from "@/lib/constants";

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (inviteFromUrl && !formData.get("inviteCode")) {
      formData.set("inviteCode", inviteFromUrl);
    }
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#121820] p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <span className="text-4xl">🎾</span>
        <h1 className="mt-2 text-2xl font-black text-white">Crear Cuenta</h1>
        <p className="text-sm text-zinc-400">Elegí tu nivel para arrancar</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="inviteCode" value={inviteFromUrl} />
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Nombre completo</label>
          <input
            name="fullName"
            type="text"
            required
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-lime-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-lime-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-lime-400"
          />
        </div>
        {!inviteFromUrl && (
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Código de invitación</label>
            <input
              name="inviteCode"
              type="text"
              required
              className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-lime-400"
            />
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Nivel de juego</label>
          <div className="grid grid-cols-2 gap-2">
            {SKILL_LEVELS.map((level) => (
              <label
                key={level.value}
                className="flex cursor-pointer flex-col items-center rounded-xl border border-white/10 bg-white/5 p-3 has-[:checked]:border-lime-400 has-[:checked]:bg-lime-400/10"
              >
                <input
                  type="radio"
                  name="skillLevel"
                  value={level.value}
                  required
                  className="sr-only"
                  defaultChecked={level.value === "intermediate"}
                />
                <span className="text-sm font-bold text-white">{level.label}</span>
                <span className="text-xs text-lime-400">{level.rating} pts</span>
              </label>
            ))}
          </div>
        </div>
        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[52px] rounded-xl bg-lime-500 font-bold text-black disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold text-lime-400">
          Ingresá
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
