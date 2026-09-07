"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCommunitySlug } from "@/hooks/useCommunitySlug";
import {
  COMMUNITY_NAV_ITEMS,
  getCommunityNavHref,
  getPartidoHref,
  PARTIDO_NAV,
} from "@/lib/navigation/community-nav";

type Props = {
  pendingCount?: number;
  className?: string;
};

export function BottomNav({ pendingCount = 0, className }: Props) {
  const pathname = usePathname();
  const community = useCommunitySlug();
  const partidoHref = getPartidoHref(community);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-nav/95 backdrop-blur-lg pb-safe",
        className
      )}
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-1 py-2">
        {COMMUNITY_NAV_ITEMS.slice(0, 2).map(({ segment, label, icon: Icon }) => {
          const href = getCommunityNavHref(community, segment);
          return (
            <NavItem
              key={segment}
              href={href}
              label={label}
              icon={Icon}
              active={pathname.startsWith(href)}
            />
          );
        })}

        <Link
          href={partidoHref}
          aria-current={pathname.startsWith(partidoHref) ? "page" : undefined}
          className={cn(
            "relative -mt-4 flex min-h-[56px] min-w-[56px] flex-col items-center justify-center rounded-2xl bg-accent px-3 shadow-lg shadow-accent/20 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            pathname.startsWith(partidoHref) && "ring-2 ring-accent/50"
          )}
        >
          <PARTIDO_NAV.icon className="h-7 w-7 text-accent-foreground" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-accent-foreground">{PARTIDO_NAV.label}</span>
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1 text-[9px] font-black text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        {COMMUNITY_NAV_ITEMS.slice(2).map(({ segment, label, icon: Icon }) => {
          const href = getCommunityNavHref(community, segment);
          return (
            <NavItem
              key={segment}
              href={href}
              label={label}
              icon={Icon}
              active={pathname.startsWith(href)}
            />
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
}: {
  href: string;
  label: string;
  icon: typeof PARTIDO_NAV.icon;
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
