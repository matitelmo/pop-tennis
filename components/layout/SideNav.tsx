"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMUNITY_NAV_ITEMS,
  getCommunityNavHref,
  getPartidoHref,
  PARTIDO_NAV,
} from "@/lib/navigation/community-nav";
import { CommunitySwitcher } from "@/components/layout/CommunitySwitcher";

type Props = {
  communitySlug: string;
  communityName: string;
  communities: { slug: string; name: string }[];
  pendingCount?: number;
  isAdmin?: boolean;
};

export function SideNav({
  communitySlug,
  communityName,
  communities,
  pendingCount = 0,
  isAdmin = false,
}: Props) {
  const pathname = usePathname();
  const partidoHref = getPartidoHref(communitySlug);

  return (
    <aside
      className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-border-subtle lg:bg-surface-nav lg:pb-6"
      aria-label="Navegación lateral"
    >
      <div className="border-b border-border-subtle py-4">
        <CommunitySwitcher
          currentSlug={communitySlug}
          currentName={communityName}
          communities={communities}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {COMMUNITY_NAV_ITEMS.slice(0, 2).map(({ segment, label, icon: Icon }) => {
          const href = getCommunityNavHref(communitySlug, segment);
          const active = pathname.startsWith(href);
          return (
            <SideNavLink key={segment} href={href} label={label} icon={Icon} active={active} />
          );
        })}

        <Link
          href={partidoHref}
          className={cn(
            "my-2 flex items-center gap-3 rounded-xl bg-accent px-3 py-3 font-bold text-accent-foreground transition hover:bg-accent/90",
            pathname.startsWith(partidoHref) && "ring-2 ring-accent/40"
          )}
        >
          <PARTIDO_NAV.icon className="h-5 w-5" strokeWidth={2.5} />
          <span>{PARTIDO_NAV.label}</span>
          {pendingCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-black text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        {COMMUNITY_NAV_ITEMS.slice(2).map(({ segment, label, icon: Icon }) => {
          const href = getCommunityNavHref(communitySlug, segment);
          const active = pathname.startsWith(href);
          return (
            <SideNavLink key={segment} href={href} label={label} icon={Icon} active={active} />
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border-subtle px-3 pt-4">
        <Link
          href="/communities"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <LayoutGrid className="h-5 w-5" />
          Comunidades
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-5 w-5" />
            Admin
          </Link>
        )}
      </div>
    </aside>
  );
}

function SideNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Settings;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-accent/15 text-accent"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
