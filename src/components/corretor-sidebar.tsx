"use client";

import {
  Bell,
  ChartLineUp,
  ChatCircleText,
  ClipboardText,
  Handshake,
  House,
  ListChecks,
  Note,
  Pause,
  SlidersHorizontal,
  SignOut,
} from "@/components/huge-icons";
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut } from "@/shared/auth/client";
import { toast } from "sonner";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";
import { hasPermission, type PermissionKey } from "@/shared/auth/permissions";
import { getPendingFeedbackCountAction } from "@/features/leads/feedback-queries";
import { Badge } from "@/components/ui/badge";

type BrokerSidebarItem = { label: string; icon: typeof ListChecks; url: string; permission: PermissionKey };
const workItems: BrokerSidebarItem[] = [
  { label: "Minha fila", icon: ListChecks, url: "/minha-fila", permission: "acessar_leads" },
  { label: "Conversas", icon: ChatCircleText, url: "/conversas", permission: "acessar_conversas" },
  { label: "Tarefas", icon: ClipboardText, url: "/tarefas", permission: "acessar_tarefas" },
  { label: "Checklist", icon: ClipboardText, url: "/checklist", permission: "acessar_documentos" },
  { label: "Documentos", icon: Note, url: "/documentos", permission: "acessar_documentos" },
  { label: "Clientes", icon: Handshake, url: "/clientes", permission: "acessar_clientes" },
];

const performanceItems: BrokerSidebarItem[] = [
  { label: "Resumo", icon: House, url: "/corretor/resumo", permission: "acessar_dashboard" },
  { label: "Minha meta", icon: ChartLineUp, url: "/minha-meta", permission: "ver_meta_propria" },
  { label: "Notificações", icon: Bell, url: "/notificacoes", permission: "acessar_notificacoes" },
];

const systemItems: BrokerSidebarItem[] = [
  { label: "Configurações", icon: SlidersHorizontal, url: "/settings", permission: "acessar_configuracoes_pessoais" },
];

function NavigationGroup({
  label,
  items,
  role,
  badges,
}: {
  label: string;
  items: BrokerSidebarItem[];
  role: UserDisplayInfo["roleKey"];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => hasPermission(role, item.permission));
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const count = badges?.[item.label];
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                  render={<Link href={item.url} prefetch />}
                  tooltip={item.label}
                >
                  <Icon weight={item.label === "Resumo" ? "fill" : "regular"} />
                  <span className="flex-1">{item.label}</span>
                  {count !== undefined && count > 0 && (
                    <Badge
                      variant="warning"
                      className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-[9px] font-bold leading-none"
                    >
                      {count > 99 ? "99+" : count}
                    </Badge>
                  )}
                </SidebarMenuButton>
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
  const [pendingFeedback, setPendingFeedback] = useState(0);

  useEffect(() => {
    getUserDisplayInfo().then(setUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const { count } = await getPendingFeedbackCountAction();
        if (!cancelled) setPendingFeedback(count);
      } catch {
        // Silent fail — badge just won't show
      }
    };
    fetchCount();
    // Poll every 60 seconds to keep badge fresh
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavigationGroup items={workItems} label="Atendimento" role={user?.roleKey ?? null} badges={{ "Minha fila": pendingFeedback }} />
        <NavigationGroup items={performanceItems} label="Desempenho" role={user?.roleKey ?? null} />
        <NavigationGroup items={systemItems} label="Sistema" role={user?.roleKey ?? null} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<button type="button" onClick={handleLogout} />} tooltip={userName}>
              <span className="grid size-7 place-items-center rounded-full bg-sidebar-warning text-xs font-semibold">{initials}</span>
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
