"use client";

import {
  Buildings,
  ChartBar,
  ClipboardText,
  CreditCard,
  FileText,
  FolderSimple,
  Handshake,
  House,
  Monitor,
  RocketLaunch,
  RoadHorizon,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Target,
  UserSwitch,
  Users,
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/shared/auth/client";
import { toast } from "sonner";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";
import { hasPermission, type PermissionKey } from "@/shared/auth/permissions";

const primaryItems = [
  { label: "Resumo", icon: House, url: "/dashboard" },
  { label: "Leads", icon: Users, url: "/leads", badge: "12" },
  { label: "Cotações", icon: FileText, url: "/cotacoes" },
  { label: "Documentos", icon: ClipboardText, url: "/documentos", badge: "7" },
  { label: "Clientes", icon: Handshake, url: "/clientes" },
];

const managementItems = [
  { label: "Primeiros passos", icon: RocketLaunch, url: "/dashboard?onboarding=1", permission: "ver_dashboard_equipe" as const },
  { label: "Equipe", icon: UserSwitch, url: "/equipe", permission: "convidar_corretor" as const },
  { label: "Metas", icon: Target, url: "/metas", permission: "ver_dashboard_equipe" as const },
  { label: "NOC", icon: Monitor, url: "/noc", permission: "ver_dashboard_equipe" as const },
  { label: "Relatórios", icon: ChartBar, url: "/relatorios" },
  { label: "Integridade", icon: ShieldCheck, url: "/integridade", badge: "3", permission: "ver_painel_integridade" as const },
  { label: "Roadmap", icon: RoadHorizon, url: "/roadmap" },
];

const administrationItems = [
  { label: "Filiais", icon: Buildings, url: "/filiais", permission: "gerenciar_filiais" as const },
  { label: "Catálogo", icon: FolderSimple, url: "/catalogo" },
  { label: "Assinatura", icon: CreditCard, url: "/assinatura", permission: "configurar_white_label" as const },
  { label: "Configurações", icon: SlidersHorizontal, url: "/settings" },
];

function NavigationGroup({
  label,
  items,
  roleKey,
}: {
  label: string;
  items: typeof primaryItems;
  roleKey: UserDisplayInfo["roleKey"];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items
            .filter((item) => !("permission" in item) || hasPermission(roleKey, item.permission as PermissionKey))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={isActive}
                    render={<a href={item.url} onClick={() => isMobile && setOpenMobile(false)} />}
                    tooltip={item.label}
                  >
                    <Icon weight={isActive ? "fill" : "regular"} />
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

export function CorreTopSidebar({ logoUrl, tenantName }: { logoUrl?: string | null; tenantName?: string | null }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDisplayInfo | null>(null);

  useEffect(() => {
    getUserDisplayInfo().then(setUser);
  }, []);

  const userName = user?.name ?? "Usuário";
  const userRole = user?.role ?? "";
  const roleKey = user?.roleKey ?? null;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    toast.info("Encerrando sua sessão...");
    try { await signOut(); toast.success("Sessão encerrada."); window.setTimeout(() => { router.replace("/login"); router.refresh(); }, 250); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível sair agora."); }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" rail>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10" size="lg" render={<Link href="/dashboard" prefetch />}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="size-7 rounded-md object-contain" />
              ) : (
                <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">C</span>
              )}
              <span className="truncate font-semibold tracking-tight">{tenantName || "CorreTop"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mx-2 rounded-md border border-sidebar-border bg-sidebar-accent/45 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] text-sidebar-foreground/55">Ambiente ativo</p>
          <p className="mt-0.5 truncate text-sm font-medium">{tenantName || "Sua corretora"}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavigationGroup items={primaryItems} label="Visão geral" roleKey={roleKey} />
        <NavigationGroup items={managementItems} label="Gestão" roleKey={roleKey} />
        <NavigationGroup items={administrationItems} label="Administração" roleKey={roleKey} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<button type="button" onClick={handleLogout} />} tooltip={userName}>
              <span className="grid size-7 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-sidebar-foreground/55">{userRole}</span>
              </span>
              <SignOut className="ml-auto size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
