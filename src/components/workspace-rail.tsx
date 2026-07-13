"use client";

import { CurrencyCircleDollar, SquaresFour } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const areas = [
  { label: "Área administrativa", href: "/dashboard", icon: SquaresFour },
  { label: "Área financeira", href: "/financeiro", icon: CurrencyCircleDollar },
] as const;

export function WorkspaceRail() {
  const pathname = usePathname();
  const financialActive = pathname === "/financeiro" || pathname.startsWith("/financeiro/");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--workspace-rail-width) flex-col items-center border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground md:flex" aria-label="Áreas do sistema">
      <nav className="flex h-full flex-col items-center justify-between">
        <WorkspaceRailButton area={areas[0]} active={!financialActive} />
        <WorkspaceRailButton area={areas[1]} active={financialActive} />
      </nav>
    </aside>
  );
}

function WorkspaceRailButton({ area, active }: { area: (typeof areas)[number]; active: boolean }) {
  const Icon = area.icon;
  return (
    <Link
      href={area.href}
      aria-label={area.label}
      aria-current={active ? "page" : undefined}
      title={area.label}
      className={cn(
        "grid size-10 place-items-center rounded-xl border text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "border-primary/20 bg-primary/10 text-primary shadow-sm",
      )}
    >
      <Icon size={19} weight={active ? "duotone" : "regular"} />
    </Link>
  );
}
