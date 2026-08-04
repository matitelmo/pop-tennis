"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Plus, Swords, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  pendingCount?: number;
};

export function BottomNav({ pendingCount = 0 }: Props) {
  const pathname = usePathname();

  const sideTabs = [
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/historial", label: "Historial", icon: Swords },
    { href: "/reglas", label: "Reglas", icon: BookOpen },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-nav/95 backdrop-blur-lg pb-safe"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-1 py-2">
        {sideTabs.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={pathname.startsWith(href)}
          />
        ))}

        <Link
          href="/partido"
          aria-current={pathname.startsWith("/partido") ? "page" : undefined}
          className={cn(
            "relative -mt-4 flex min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-2xl bg-accent px-3 shadow-lg shadow-accent/20 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            pathname.startsWith("/partido") && "ring-2 ring-accent/50"
          )}
        >
          <Plus className="h-7 w-7 text-accent-foreground" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-accent-foreground">Partido</span>
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1 text-[9px] font-black text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        {sideTabs.slice(2).map(({ href, label, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={pathname.startsWith(href)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Trophy;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active ? "text-accent" : "text-zinc-400 hover:text-zinc-200"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
