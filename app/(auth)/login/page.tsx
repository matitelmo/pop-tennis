import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-3xl bg-white/5 p-8 text-center text-zinc-400">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
