"use client";

import type { CSSProperties, ReactNode } from "react";
import { CorreTopSidebar } from "@/components/corretop-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type Branding = {
  brandColor: string | null;
  logoUrl: string | null;
};

export function AppShell({
  children,
  branding,
}: {
  children: ReactNode;
  branding?: Branding;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--header-height": "3.75rem",
        } as CSSProperties
      }
    >
      <CorreTopSidebar logoUrl={branding?.logoUrl ?? null} />
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
