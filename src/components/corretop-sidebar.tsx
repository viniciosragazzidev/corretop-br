"use client";

import {
  BookOpen,
  Bell,
  Buildings,
  ChatCircleText,
  ChartBar,
  ClipboardText,
  CreditCard,
  CurrencyCircleDollar,
  FolderSimple,
  Handshake,
  House,
  ListChecks,
  Monitor,
  Note,
  RoadHorizon,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Target,
  Users,
} from "@/components/huge-icons";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/shared/auth/client";
import { toast } from "sonner";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";
import { hasPermission, type PermissionKey } from "@/shared/auth/permissions";

const primaryItems = [
  { label: "Conversas", icon: ChatCircleText, url: "/conversas" },
  { label: "Leads", icon: Users, url: "/leads" },
  { label: "Tarefas", icon: ClipboardText, url: "/tarefas" },
  { label: "Cotações", icon: ListChecks, url: "/cotacoes" },
  { label: "Documentos", icon: Note, url: "/documentos" },
  { label: "Clientes", icon: Handshake, url: "/clientes" },
  { label: "Vendas", icon: CurrencyCircleDollar, url: "/vendas" },
];

const managementItems = [
  { label: "Resumo", icon: House, url: "/dashboard" },
  { label: "Equipe", icon: Users, url: "/equipe", permission: "convidar_corretor" as const },
  { label: "Metas", icon: Target, url: "/metas", permission: "gerenciar_metas" as const },
  { label: "Relatórios", icon: ChartBar, url: "/relatorios" },
  { label: "Filiais", icon: Buildings, url: "/filiais", permission: "gerenciar_filiais" as const },
  { label: "Comissoes", icon: CurrencyCircleDollar, url: "/configuracoes/comissoes", permission: "gerenciar_comissoes" as const },
];

const operationItems = [
  { label: "NOC", icon: Monitor, url: "/noc", permission: "ver_dashboard_equipe" as const },
  { label: "Integridade", icon: ShieldCheck, url: "/integridade", permission: "ver_painel_integridade" as const },
  { label: "Notificacoes", icon: Bell, url: "/notificacoes" },
];

const systemItems = [
  { label: "Catálogo", icon: FolderSimple, url: "/catalogo" },
  { label: "Comissões", icon: CurrencyCircleDollar, url: "/configuracoes/comissoes", permission: "gerenciar_comissoes" as const },
  { label: "Assinatura", icon: CreditCard, url: "/assinatura", permission: "configurar_white_label" as const },
  { label: "Configurações", icon: SlidersHorizontal, url: "/settings" },
  { label: "Roadmap", icon: RoadHorizon, url: "/roadmap" },
];

const supportItems = [
  { label: "Guia do sistema", icon: BookOpen, url: "/guia" },
];

function NavigationGroup({
  label,
  items,
  roleKey,
  groupIndex,
}: {
  label: string;
  items: typeof primaryItems;
  roleKey: UserDisplayInfo["roleKey"];
  groupIndex: number;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.18,
        ease: [0, 0, 0.2, 1],
        delay: groupIndex * 0.06,
      }}
    >
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items
              .filter((item) => !("permission" in item) || hasPermission(roleKey, item.permission as PermissionKey))
              .map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.15,
                      ease: [0, 0, 0.2, 1],
                      delay: groupIndex * 0.06 + index * 0.04,
                    }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<a href={item.url} onClick={() => isMobile && setOpenMobile(false)} />}
                        tooltip={item.label}
                      >
                        <Icon weight={isActive ? "fill" : "regular"} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </motion.div>
  );
}

export function CorreTopSidebar({ logoUrl }: { logoUrl?: string | null }) {
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
        <Link href="/dashboard" prefetch className="block px-2 pt-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-[64%] rounded-md object-contain object-left" />
          ) : (
            <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">C</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavigationGroup items={primaryItems} label="Operacao" roleKey={roleKey} groupIndex={0} />
        <NavigationGroup items={managementItems} label="Gestão" roleKey={roleKey} groupIndex={1} />
        <NavigationGroup items={operationItems} label="Operação" roleKey={roleKey} groupIndex={2} />
        <NavigationGroup items={systemItems} label="Administracao" roleKey={roleKey} groupIndex={3} />
        <NavigationGroup items={supportItems} label="Ajuda" roleKey={roleKey} groupIndex={4} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton size="lg" tooltip={userName}>
                  <span className="grid size-7 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</span>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/55">{userRole}</span>
                  </span>
                  <SignOut className="ml-auto size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              } />
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[var(--sidebar-width)]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">{initials}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{userName}</span>
                        <span className="text-xs text-muted-foreground">{userRole}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href="/settings" />}>
                  <SlidersHorizontal className="size-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <SignOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
