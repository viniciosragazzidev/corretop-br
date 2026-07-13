"use client";

import { Bell } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";

type DashboardHeaderProps = {
  breadcrumb: string;
  title: string;
  rightSlot?: React.ReactNode;
};

export function DashboardHeader({
  breadcrumb,
  title,
  rightSlot,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <div className="h-4 w-px bg-border" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{breadcrumb}</p>
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </div>
      {rightSlot}
      <GlobalSearch />
      <ThemeToggle />
      <Button aria-label="Notificacoes" size="icon" variant="ghost">
        <Bell />
      </Button>
    </header>
  );
}
