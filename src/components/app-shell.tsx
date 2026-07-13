"use client";

import type { CSSProperties, ReactNode } from "react";
import { CorreTopSidebar } from "@/components/corretop-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceRail } from "@/components/workspace-rail";

type Branding = {
  brandColor: string | null;
  logoUrl: string | null;
  tenantName: string | null;
};

function getReadableForeground(hex: string) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
  const luminance = channels.reduce((total, channel, index) => {
    const adjusted = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + adjusted * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  return luminance > 0.45 ? "#18181b" : "#ffffff";
}

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
          "--sidebar-width": "21.5rem",
          "--workspace-rail-width": "4rem",
          "--header-height": "3.75rem",
          ...(branding?.brandColor
            ? {
                "--primary": branding.brandColor,
                "--primary-foreground": getReadableForeground(branding.brandColor),
                "--ring": branding.brandColor,
                "--sidebar-primary": branding.brandColor,
                "--sidebar-primary-foreground": getReadableForeground(branding.brandColor),
                "--sidebar-ring": branding.brandColor,
              }
            : {}),
        } as CSSProperties
      }
    >
      <WorkspaceRail />
      <CorreTopSidebar logoUrl={branding?.logoUrl ?? null} tenantName={branding?.tenantName ?? null} />
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
