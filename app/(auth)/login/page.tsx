"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "@/lib/actions/auth";

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
    <div className="rounded-3xl border border-white/10 bg-[#121820] p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <span className="text-4xl">🎾</span>
        <h1 className="mt-2 text-2xl font-black text-white">Pop Tennis</h1>
        <p className="text-sm text-zinc-400">Ranking & Gamification</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
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
            className="w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-lime-400"
          />
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
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-bold text-lime-400">
          Registrate
        </Link>
      </p>
    </div>
  );
}
