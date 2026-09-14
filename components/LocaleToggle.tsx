"use client";

import { useCommunity } from "@/components/providers/CommunityProvider";
import { cn } from "@/lib/utils";
import type { CommunityLocale } from "@/lib/community/locale";

const OPTIONS: { id: CommunityLocale; label: string }[] = [
  { id: "es", label: "ES" },
  { id: "en", label: "EN" },
];

type Props = {
  className?: string;
  compact?: boolean;
};

export function LocaleToggle({ className, compact = false }: Props) {
  const { locale, setLocale, translate: tr } = useCommunity();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact && (
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {tr("language")}
        </span>
      )}
      <div className="flex rounded-full border border-border-subtle bg-surface-glass p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setLocale(option.id)}
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-full px-2.5 text-xs font-bold transition",
              locale === option.id
                ? "bg-accent text-accent-foreground"
                : "text-zinc-400 hover:text-white"
            )}
            aria-pressed={locale === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
