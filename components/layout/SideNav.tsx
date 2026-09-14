"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCommunityNavHref,
  getCommunityNavItems,
  getPartidoHref,
  getPartidoNav,
} from "@/lib/navigation/community-nav";
import { CommunitySwitcher } from "@/components/layout/CommunitySwitcher";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useCommunity } from "@/components/providers/CommunityProvider";
import { t } from "@/lib/i18n/messages";

type Props = {
  communitySlug: string;
  communityName: string;
  communities: { slug: string; name: string }[];
  showFindPlayers: boolean;
  pendingCount?: number;
  isAdmin?: boolean;
};

function splitNavItems(locale: "en" | "es", showFindPlayers: boolean) {
  const items = getCommunityNavItems(locale, { showFindPlayers });
  const rulesIdx = items.findIndex((i) => i.segment === "reglas");
  return {
    beforePartido: items.slice(0, rulesIdx),
    afterPartido: items.slice(rulesIdx),
  };
}

export function SideNav({
  communitySlug,
  communityName,
  communities,
  showFindPlayers,
  pendingCount = 0,
  isAdmin = false,
}: Props) {
  const pathname = usePathname();
  const { locale } = useCommunity();
  const partidoHref = getPartidoHref(communitySlug);
  const partidoNav = getPartidoNav(locale);
  const { beforePartido, afterPartido } = splitNavItems(locale, showFindPlayers);

  return (
    <aside
      className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-border-subtle lg:bg-surface-nav lg:pb-6"
      aria-label={locale === "en" ? "Side navigation" : "Navegación lateral"}
    >
      <div className="border-b border-border-subtle py-4">
        <CommunitySwitcher
          currentSlug={communitySlug}
          currentName={communityName}
          communities={communities}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {beforePartido.map(({ segment, label, icon: Icon }) => (
          <SideNavLink
            key={segment}
            href={getCommunityNavHref(communitySlug, segment)}
            label={label}
            icon={Icon}
            active={pathname.startsWith(getCommunityNavHref(communitySlug, segment))}
          />
        ))}

        <Link
          href={partidoHref}
          className={cn(
            "my-2 flex items-center gap-3 rounded-xl bg-accent px-3 py-3 font-bold text-accent-foreground transition hover:bg-accent/90",
            pathname.startsWith(partidoHref) && "ring-2 ring-accent/40"
          )}
        >
          <partidoNav.icon className="h-5 w-5" strokeWidth={2.5} />
          <span>{partidoNav.label}</span>
          {pendingCount > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-black text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        {afterPartido.map(({ segment, label, icon: Icon }) => (
          <SideNavLink
            key={segment}
            href={getCommunityNavHref(communitySlug, segment)}
            label={label}
            icon={Icon}
            active={pathname.startsWith(getCommunityNavHref(communitySlug, segment))}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border-subtle px-3 pt-4">
        <LocaleToggle />
        <Link
          href="/communities"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <LayoutGrid className="h-5 w-5" />
          {t(locale, "navCommunities")}
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
  icon: LucideIcon;
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
