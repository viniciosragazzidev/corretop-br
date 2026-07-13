"use client";

import type { CSSProperties, ReactNode } from "react";

import { PlatformAdminSidebar } from "./platform-admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function PlatformAdminShell({ children }: { children: ReactNode }) {
  return <SidebarProvider style={{ "--sidebar-width": "17.5rem" } as CSSProperties}><PlatformAdminSidebar /><SidebarInset className="bg-background">{children}</SidebarInset></SidebarProvider>;
}
