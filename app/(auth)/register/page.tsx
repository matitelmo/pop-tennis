"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import { register } from "@/lib/actions/auth";
import { getAvailableRosterPlayers, type RosterPlayer } from "@/lib/actions/roster";
import { SKILL_LEVELS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/types/database";
import { Skeleton } from "@/components/ui/Sheet";

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<"preset" | "new">("preset");
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");

  useEffect(() => {
    getAvailableRosterPlayers().then(setRoster);
  }, []);

  const selectedPreset = roster.find((r) => r.id === selectedId);
  const ratingPreview = SKILL_LEVELS.find((l) => l.value === skillLevel)?.rating ?? 1200;

  useEffect(() => {
    if (selectedPreset) {
      setSkillLevel(selectedPreset.suggested_skill_level as SkillLevel);
    }
  }, [selectedPreset]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (inviteFromUrl && !formData.get("inviteCode")) {
      formData.set("inviteCode", inviteFromUrl);
    }
    formData.set("skillLevel", skillLevel);
    if (mode === "preset" && selectedId) {
      formData.set("rosterPlayerId", selectedId);
    } else if (mode === "new") {
      formData.set("newDisplayName", newName);
    }
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const canGoStep2 = mode === "preset" ? !!selectedId : newName.trim().length >= 2;

  return (
    <Card variant="elevated" className="rounded-3xl p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-4 text-display">Wild On Pop Tennis</h1>
      </div>

      <StepIndicator steps={["Identidad", "Cuenta"]} current={step} className="mb-6" />

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="inviteCode" value={inviteFromUrl} />

        {step === 1 && (
          <>
            <div className="flex gap-2">
              {(["preset", "new"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    mode === m
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border text-zinc-400"
                  )}
                >
                  {m === "preset" ? "Del roster" : "Soy nuevo"}
                </button>
              ))}
            </div>

            {mode === "preset" ? (
              <div className="flex max-h-48 snap-x snap-mandatory flex-wrap gap-2 overflow-y-auto">
                {roster.length === 0 && (
                  <p className="text-caption">
                    Todos los presets ya fueron reclamados. Creá un nombre nuevo.
                  </p>
                )}
                {roster.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "min-h-[44px] snap-start rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      selectedId === r.id
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/50"
                        : "bg-surface-glass text-zinc-200"
                    )}
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <Label htmlFor="newName">Tu nombre en la banda</Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  type="text"
                  required
                />
              </div>
            )}

            <p className="text-xs text-warning">Este nombre no se puede cambiar después.</p>

            <Button type="button" disabled={!canGoStep2} onClick={() => setStep(2)} className="w-full" size="lg">
              Siguiente
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Card className="text-center">
              <p className="text-caption">Vas a jugar como</p>
              <p className="text-title">
                {mode === "preset" ? selectedPreset?.display_name : newName}
              </p>
            </Card>

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
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {!inviteFromUrl && (
              <div>
                <Label htmlFor="inviteCode">Código de invitación</Label>
                <Input id="inviteCode" name="inviteCode" type="text" required />
              </div>
            )}

            <div>
              <Label>Nivel de juego</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSkillLevel(level.value)}
                    className={cn(
                      "min-h-[52px] rounded-xl border p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      skillLevel === level.value
                        ? "border-accent bg-accent-muted ring-2 ring-accent/30"
                        : "border-border bg-surface-glass"
                    )}
                  >
                    <span className="block text-sm font-bold text-white">{level.label}</span>
                    <span className="text-xs text-accent">{level.rating} pts</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-sm text-accent">
                Arrancás con <strong>{ratingPreview} pts</strong>
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1" size="lg">
                Atrás
              </Button>
              <Button type="submit" disabled={loading} className="flex-1" size="lg">
                {loading ? "Creando..." : "Entrar a la banda"}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-caption">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold text-accent">
          Ingresá
        </Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
      <RegisterForm />
    </Suspense>
  );
}
