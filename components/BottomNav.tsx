"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Plus, Swords, Trophy, User } from "lucide-react";

type Props = {
  pendingCount?: number;
};

export function BottomNav({ pendingCount = 0 }: Props) {
  const pathname = usePathname();

  const sideTabs = [
    { href: "/ranking", label: "Ranking", icon: Trophy, badge: pendingCount },
    { href: "/historial", label: "Historial", icon: Swords },
    { href: "/reglas", label: "Reglas", icon: BookOpen },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f1419]/95 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex max-w-md items-end justify-around px-1 py-2">
        {sideTabs.slice(0, 2).map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={Icon}
              active={active}
              badge={badge}
            />
          );
        })}

        <Link
          href="/partido"
          className={`-mt-4 flex min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-2xl bg-lime-500 px-3 shadow-lg shadow-lime-500/20 transition active:scale-95 ${
            pathname.startsWith("/partido") ? "ring-2 ring-lime-300" : ""
          }`}
        >
          <Plus className="h-7 w-7 text-black" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-black">Partido</span>
        </Link>

        {sideTabs.slice(2).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <NavItem key={href} href={href} label={label} icon={Icon} active={active} />
          );
        })}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: typeof Trophy;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] transition active:scale-95 ${
        active ? "text-lime-400" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-1 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-black">
          {badge}
        </span>
      )}
    </Link>
  );
}
