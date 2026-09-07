"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
};

export function CommunityAdminNav({ slug, name }: Props) {
  const pathname = usePathname();
  const base = `/admin/communities/${slug}`;

  const tabs = [
    { href: base, label: "Configuración", exact: true },
    { href: `${base}/members`, label: "Miembros" },
    { href: `/admin/matches?community=${slug}`, label: "Partidos" },
    { href: `/admin/roster?community=${slug}`, label: "Roster" },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 p-4 lg:sticky lg:top-6 lg:mb-0">
      <p className="text-xs font-bold uppercase tracking-wider text-accent">Administrar</p>
      <p className="mt-1 text-lg font-bold text-white">{name}</p>
      <nav className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition lg:w-full",
                active
                  ? "bg-accent text-accent-foreground"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
