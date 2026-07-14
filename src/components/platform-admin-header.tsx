"use client";

import { Bell } from "@/components/huge-icons";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function PlatformAdminHeader({
  breadcrumb,
  title,
}: {
  breadcrumb: string;
  title: string;
}) {
  return (
    <header className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4 lg:px-6">
      <SidebarTrigger />
      <div className="h-4 w-px bg-border" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{breadcrumb}</p>
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </div>
      <Button aria-label="Notificações" size="icon" variant="ghost">
        <Bell />
      </Button>
    </header>
  );
}
