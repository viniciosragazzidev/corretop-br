"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";

import { Bell, BookOpen, Buildings, ChartBar, ChatCircleText, ClipboardText, CreditCard, CurrencyCircleDollar, FileArrowDown, FolderSimple, Handshake, House, Megaphone, Monitor, Note, ShieldCheck, SignOut, SlidersHorizontal, SquaresFour, Target, Users, WifiHigh } from "@/components/huge-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";
import { hasPermission, type PermissionKey } from "@/shared/auth/permissions";
import { signOut } from "@/shared/auth/client";
import { CorreTopLogo } from "@/components/corretop-logo";

type SidebarItem = { label: string; icon: typeof House; url: string; permission: PermissionKey };
const primaryItems: SidebarItem[] = [
  { label: "Conversas", icon: ChatCircleText, url: "/conversas", permission: "acessar_conversas" },
  { label: "Leads", icon: Users, url: "/leads", permission: "acessar_leads" },
  { label: "Tarefas", icon: ClipboardText, url: "/tarefas", permission: "acessar_tarefas" },
  { label: "Documentos", icon: Note, url: "/documentos", permission: "acessar_documentos" },
  { label: "Clientes", icon: Handshake, url: "/clientes", permission: "acessar_clientes" },
  { label: "Vendas", icon: CurrencyCircleDollar, url: "/vendas", permission: "acessar_vendas" },
  { label: "Materiais de Divulgação", icon: Megaphone, url: "/materiais-divulgacao", permission: "acessar_materiais_divulgacao" },
];
const toolsItems: SidebarItem[] = [
  { label: "Tabelas Personalizadas", icon: SquaresFour, url: "/ferramentas-vendas/tabelas-personalizadas", permission: "acessar_ferramentas_vendas" },
];
const managementItems: SidebarItem[] = [
  { label: "Resumo", icon: House, url: "/dashboard", permission: "acessar_dashboard" },
  { label: "Equipe", icon: Users, url: "/equipe", permission: "convidar_corretor" },
  { label: "Metas", icon: Target, url: "/metas", permission: "gerenciar_metas" },
  { label: "Relatórios", icon: ChartBar, url: "/relatorios", permission: "acessar_relatorios" },
  { label: "Filiais", icon: Buildings, url: "/filiais", permission: "gerenciar_filiais" },
  { label: "Distribuição", icon: WifiHigh, url: "/leads/distribuicao", permission: "gerenciar_filiais" },
  { label: "Comissões", icon: CurrencyCircleDollar, url: "/configuracoes/comissoes", permission: "gerenciar_comissoes" },
];
const operationItems: SidebarItem[] = [
  { label: "NOC", icon: Monitor, url: "/noc", permission: "ver_dashboard_equipe" },
  { label: "Integridade", icon: ShieldCheck, url: "/integridade", permission: "ver_painel_integridade" },
  { label: "Notificações", icon: Bell, url: "/notificacoes", permission: "acessar_notificacoes" },
];
const systemItems: SidebarItem[] = [
  { label: "Importações Meta", icon: FileArrowDown, url: "/marketing/importacoes", permission: "ver_importacoes_meta" },
  { label: "Catálogo", icon: FolderSimple, url: "/catalogo", permission: "acessar_catalogo" },
  { label: "Comissões", icon: CurrencyCircleDollar, url: "/configuracoes/comissoes", permission: "gerenciar_comissoes" },
  { label: "Assinatura", icon: CreditCard, url: "/assinatura", permission: "configurar_white_label" },
  { label: "Configurações", icon: SlidersHorizontal, url: "/settings", permission: "acessar_configuracoes_pessoais" },
];
const supportItems: SidebarItem[] = [{ label: "Guia do sistema", icon: BookOpen, url: "/guia", permission: "acessar_guia" }];

function NavigationGroup({ label, items, roleKey, jobTitle, groupIndex }: { label: string; items: SidebarItem[]; roleKey: UserDisplayInfo["roleKey"]; jobTitle: UserDisplayInfo["jobTitle"]; groupIndex: number }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleItems = roleKey ? items.filter((item) => {
    if (jobTitle === "marketing" && ["/conversas", "/tarefas", "/documentos", "/clientes", "/vendas", "/checklist", "/minha-fila", "/dashboard", "/corretor", "/metas", "/relatorios", "/noc", "/integridade", "/assinatura", "/filiais", "/unidades", "/gestor", "/diretor"].some(path => item.url === path || item.url.startsWith(path + "/"))) {
      return false;
    }
    return hasPermission(roleKey, item.permission);
  }) : [];
  if (visibleItems.length === 0) return null;
  return <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, ease: [0, 0, 0.2, 1], delay: groupIndex * 0.06 }}><SidebarGroup><SidebarGroupLabel>{label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{visibleItems.map((item, index) => { const Icon = item.icon; const isActive = pathname === item.url || pathname.startsWith(item.url + "/"); return <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: groupIndex * 0.06 + index * 0.04 }}><SidebarMenuItem><SidebarMenuButton isActive={isActive} render={<Link href={item.url} onClick={() => isMobile && setOpenMobile(false)} prefetch />} tooltip={item.label}><Icon weight={isActive ? "fill" : "regular"} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem></motion.div>; })}</SidebarMenu></SidebarGroupContent></SidebarGroup></motion.div>;
}

export function CorreTopSidebar({ logoUrl }: { logoUrl?: string | null }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDisplayInfo | null>(null);
  useEffect(() => { getUserDisplayInfo().then(setUser); }, []);
  const userName = user?.name ?? "Usuário";
  const userRole = user?.role ?? "";
  const roleKey = user?.roleKey ?? null;
  const initials = userName.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();

  async function handleLogout() {
    toast.info("Encerrando sua sessão...");
    try { await signOut(); toast.success("Sessão encerrada."); window.setTimeout(() => { router.replace("/login"); router.refresh(); }, 250); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível sair agora."); }
  }

  return <Sidebar collapsible="icon" variant="sidebar" rail><SidebarHeader><Link href="/dashboard" prefetch className="block px-2 pt-2"><CorreTopLogo src={logoUrl} className="h-8 w-full rounded-md object-contain object-left" /></Link></SidebarHeader><SidebarContent><NavigationGroup items={primaryItems} label="Operação" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={0} /><NavigationGroup items={toolsItems} label="Ferramentas" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={1} /><NavigationGroup items={managementItems} label="Gestão" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={2} /><NavigationGroup items={operationItems} label="Operação" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={3} /><NavigationGroup items={systemItems} label="Administração" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={4} /><NavigationGroup items={supportItems} label="Ajuda" roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={5} /></SidebarContent><SidebarFooter><SidebarMenu><SidebarMenuItem><DropdownMenu><DropdownMenuTrigger render={<SidebarMenuButton size="lg" tooltip={userName}><span className="grid size-7 place-items-center rounded-full bg-sidebar-warning text-xs font-semibold">{initials}</span><span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{userName}</span><span className="truncate text-xs text-sidebar-foreground/55">{userRole}</span></span><SignOut className="ml-auto size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" /></SidebarMenuButton>} /><DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[var(--sidebar-width)]"><DropdownMenuGroup><DropdownMenuLabel><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-sidebar-warning text-xs font-semibold">{initials}</span><div className="flex flex-col"><span className="text-sm font-medium leading-none">{userName}</span><span className="text-xs text-muted-foreground">{userRole}</span></div></div></DropdownMenuLabel></DropdownMenuGroup><DropdownMenuSeparator />{roleKey && hasPermission(roleKey, "acessar_configuracoes") ? <DropdownMenuItem render={<Link href="/settings" prefetch />}><SlidersHorizontal className="size-4" />Configurações</DropdownMenuItem> : null}<DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={handleLogout}><SignOut className="size-4" />Sair</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarMenuItem></SidebarMenu></SidebarFooter></Sidebar>;
}
