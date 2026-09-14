"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCommunityNavHref,
  getCommunityNavItems,
  getPartidoHref,
  getPartidoNav,
} from "@/lib/navigation/community-nav";
import { useCommunity } from "@/components/providers/CommunityProvider";

type Props = {
  pendingCount?: number;
  className?: string;
  communitySlug: string;
  showFindPlayers: boolean;
};

function shortLabel(label: string): string {
  if (label.length <= 8) return label;
  return label.split(" ")[0] ?? label;
}

export function BottomNav({
  pendingCount = 0,
  className,
  communitySlug,
  showFindPlayers,
}: Props) {
  const pathname = usePathname();
  const { locale } = useCommunity();
  const partidoHref = getPartidoHref(communitySlug);
  const partidoNav = getPartidoNav(locale);
  const items = getCommunityNavItems(locale, { showFindPlayers });

  const leftItems = items.filter((i) => ["ranking", "historial"].includes(i.segment));
  const fourthItem = showFindPlayers
    ? items.find((i) => i.segment === "find-players")
    : items.find((i) => i.segment === "reglas");
  const perfilItem = items.find((i) => i.segment === "perfil");

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-nav/95 backdrop-blur-lg pb-safe",
        className
      )}
      aria-label={locale === "en" ? "Main navigation" : "Navegación principal"}
    >
      <div className="mx-auto flex max-w-lg items-end justify-between gap-0.5 px-1 py-2">
        {leftItems.map(({ segment, label, icon: Icon }) => {
          const href = getCommunityNavHref(communitySlug, segment);
          return (
            <NavItem
              key={segment}
              href={href}
              label={shortLabel(label)}
              icon={Icon}
              active={pathname.startsWith(href)}
            />
          );
        })}

        <Link
          href={partidoHref}
          aria-current={pathname.startsWith(partidoHref) ? "page" : undefined}
          className={cn(
            "relative -mt-4 flex min-h-[56px] min-w-[56px] shrink-0 flex-col items-center justify-center rounded-2xl bg-accent px-2 shadow-lg shadow-accent/20 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            pathname.startsWith(partidoHref) && "ring-2 ring-accent/50"
          )}
        >
          <partidoNav.icon className="h-7 w-7 text-accent-foreground" strokeWidth={2.5} />
          <span className="max-w-[52px] truncate text-[9px] font-bold text-accent-foreground">
            {shortLabel(partidoNav.label)}
          </span>
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1 text-[9px] font-black text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        {fourthItem && (
          <NavItem
            href={getCommunityNavHref(communitySlug, fourthItem.segment)}
            label={shortLabel(fourthItem.label)}
            icon={fourthItem.icon}
            active={pathname.startsWith(getCommunityNavHref(communitySlug, fourthItem.segment))}
          />
        )}

        {perfilItem && (
          <NavItem
            href={getCommunityNavHref(communitySlug, perfilItem.segment)}
            label={shortLabel(perfilItem.label)}
            icon={perfilItem.icon}
            active={pathname.startsWith(getCommunityNavHref(communitySlug, perfilItem.segment))}
          />
        )}
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
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active ? "text-accent" : "text-zinc-400 hover:text-zinc-200"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="max-w-[56px] truncate text-center font-medium leading-tight">{label}</span>
    </Link>
  );
}
