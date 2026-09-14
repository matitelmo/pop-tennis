"use client";

import Link from "next/link";
import { useState } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import { register } from "@/lib/actions/auth";
import { SKILL_LEVELS } from "@/lib/constants";
import type { CommunityLocale } from "@/lib/community/locale";
import { getSkillLabelLocalized, t } from "@/lib/i18n/messages";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { cn } from "@/lib/utils";
import type { Gender, SkillLevel } from "@/types/database";

type Props = {
  communitySlug: string;
  communityName: string;
  locale?: CommunityLocale;
  collectPhone?: boolean;
};

export function OpenRegisterForm({
  communitySlug,
  communityName,
  locale = "es",
  collectPhone = false,
}: Props) {
  const isEn = locale === "en";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");

  const ratingPreview = SKILL_LEVELS.find((l) => l.value === skillLevel)?.rating ?? 1000;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("community", communitySlug);
    formData.set("fullName", fullName);
    formData.set("gender", gender ?? "");
    formData.set("skillLevel", skillLevel);
    if (collectPhone) formData.set("phoneNumber", phone);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const canGoStep2 =
    fullName.trim().length >= 2 &&
    (gender === "male" || gender === "female") &&
    (!collectPhone || phone.trim().length >= 7);

  return (
    <Card variant="elevated" className="rounded-3xl p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-4 text-display">{communityName}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {isEn ? "Free registration" : "Registro gratis"}
        </p>
      </div>

      <StepIndicator
        steps={isEn ? ["Profile", "Account"] : ["Identidad", "Cuenta"]}
        current={step}
        className="mb-6"
      />

      <form action={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div>
              <Label htmlFor="fullName">{isEn ? "Full name" : "Nombre completo"}</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isEn ? "As shown on the leaderboard" : "Como aparecés en la liga"}
                required
                minLength={2}
              />
            </div>

            {collectPhone && (
              <div>
                <Label htmlFor="phone">{t(locale, "phoneNumber")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t(locale, "phonePlaceholder")}
                  autoComplete="tel"
                  required
                  minLength={7}
                />
                <p className="mt-1 text-xs text-zinc-500">{t(locale, "phoneHint")}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-400">
                {isEn ? "Division" : "Categoría"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "male" as const, label: t(locale, "genderMale") },
                    { value: "female" as const, label: t(locale, "genderFemale") },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={cn(
                      "min-h-[44px] rounded-xl border text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      gender === g.value
                        ? "border-accent bg-accent-muted text-accent"
                        : "border-border bg-surface-glass text-zinc-300"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-400">
                {isEn ? "Starting level" : "Nivel inicial"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSkillLevel(level.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      skillLevel === level.value
                        ? "border-accent bg-accent-muted"
                        : "border-border bg-surface-glass"
                    )}
                  >
                    <span className="font-bold text-white">
                      {getSkillLabelLocalized(level.value, locale)}
                    </span>
                    <span className="block text-xs text-zinc-400">{level.rating} pts</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {isEn
                  ? `You start around ${ratingPreview} pts based on your level.`
                  : `Arrancás con ~${ratingPreview} pts según tu nivel.`}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canGoStep2}
              className="w-full"
              size="lg"
            >
              {isEn ? "Next" : "Siguiente"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">{isEn ? "Password" : "Contraseña"}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-zinc-500">
              {isEn
                ? "Ranking is free. Logging matches requires a subscription ($10/mo or $60/yr)."
                : "Podés ver el ranking gratis. Para cargar partidos necesitás suscripción ($10/mo o $60/año)."}
            </p>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                size="lg"
              >
                {isEn ? "Back" : "Atrás"}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1" size="lg">
                {loading
                  ? isEn
                    ? "Creating..."
                    : "Creando..."
                  : isEn
                    ? "Create account"
                    : "Crear cuenta"}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isEn ? "Already have an account? " : "¿Ya tenés cuenta? "}
        <Link href={`/login?community=${communitySlug}`} className="font-bold text-accent">
          {isEn ? "Log in" : "Iniciar sesión"}
        </Link>
      </p>
    </Card>
  );
}
