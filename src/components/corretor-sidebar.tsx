"use client";

import {
  Bell,
  ChartLineUp,
  ClipboardText,
  FileText,
  Handshake,
  House,
  ListChecks,
  Pause,
  RoadHorizon,
  SignOut,
} from "@phosphor-icons/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut } from "@/shared/auth/client";
import { toast } from "sonner";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";

const workItems = [
  { label: "Resumo", icon: House, url: "/corretor/resumo" },
  { label: "Minha fila", icon: ListChecks, url: "/minha-fila", badge: "10" },
  { label: "Cotações", icon: FileText, url: "/cotacoes", badge: "3" },
  { label: "Documentos", icon: ClipboardText, url: "/documentos", badge: "3" },
  { label: "Clientes", icon: Handshake, url: "/clientes" },
];

const trackingItems = [
  { label: "Roadmap", icon: RoadHorizon, url: "/roadmap" },
  { label: "Minha meta", icon: ChartLineUp, url: "/minha-meta" },
  { label: "Notificações", icon: Bell, url: "/notificacoes", badge: "2" },
];

function NavigationGroup({
  label,
  items,
}: {
  label: string;
  items: typeof workItems;
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                  render={<Link href={item.url} prefetch />}
                  tooltip={item.label}
                >
                  <Icon weight={item.label === "Resumo" ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function CorretorSidebar() {
  const router = useRouter();
  const [user, setUser] = useState<UserDisplayInfo | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    getUserDisplayInfo().then(setUser);
  }, []);

  const userName = user?.name ?? "Luiza Costa";
  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    toast.info("Encerrando sua sessão...");
    try { await signOut(); toast.success("Sessão encerrada."); window.setTimeout(() => { router.replace("/login"); router.refresh(); }, 250); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível sair agora."); }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10" size="lg" render={<Link href="/corretor/resumo" prefetch />}>
              <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                C
              </span>
              <span className="font-semibold tracking-tight">CorreTop</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mx-2 rounded-md border border-sidebar-border bg-sidebar-accent/45 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] text-sidebar-foreground/55">Meu ambiente</p>
          <p className="mt-0.5 text-sm font-medium">Vida Mais Corretora</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavigationGroup items={workItems} label="Principal" />
        <NavigationGroup items={trackingItems} label="Acompanhamento" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<button type="button" onClick={handleLogout} />} tooltip={userName}>
              <span className="grid size-7 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-sidebar-foreground/55">Corretor</span>
              </span>
              <SignOut className="ml-auto size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton
              onClick={() => setIsAvailable((current) => !current)}
              tooltip={isAvailable ? "Pausar recebimento" : "Retomar recebimento"}
            >
              <Pause weight="fill" />
              <span>{isAvailable ? "Disponível para leads" : "Recebimento pausado"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
