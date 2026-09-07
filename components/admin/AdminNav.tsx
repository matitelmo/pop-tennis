"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/communities", label: "Comunidades" },
  { href: "/admin/roster", label: "Roster" },
  { href: "/admin/matches", label: "Partidos" },
  { href: "/admin/disputes", label: "Disputas" },
];

type Props = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

export function AdminNav({ className, orientation = "horizontal" }: Props) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "space-y-3 border-b border-white/10 pb-4",
        isVertical && "border-b-0 pb-0",
        className
      )}
    >
      <nav
        className={cn(
          "flex flex-wrap gap-2",
          isVertical && "flex-col flex-nowrap gap-1"
        )}
      >
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isVertical && "w-full",
                active
                  ? "bg-accent/20 text-accent"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <p className={cn("text-xs text-zinc-500", isVertical && "mt-6 border-t border-white/10 pt-4")}>
        Estás en modo admin.{" "}
        <Link href="/communities" className="text-zinc-400 underline hover:text-white">
          Cambiar a vista jugador
        </Link>
      </p>
    </div>
  );
}
