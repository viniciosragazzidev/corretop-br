"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";

import {
  Bell,
  BookOpen,
  Buildings,
  ChartBar,
  ChatCircleText,
  ClipboardText,
  CurrencyCircleDollar,
  FileArrowDown,
  FolderSimple,
  Gear,
  Handshake,
  HelpCircle,
  House,
  Megaphone,
  Monitor,
  Note,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Target,
  Users,
  WifiHigh,
} from "@/components/huge-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarCollapsibleGroup } from "@/components/sidebar-collapsible-group";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";
import { hasCapability, type PermissionKey } from "@/shared/auth/permissions";
import { signOut } from "@/shared/auth/client";
import { CorreTopLogo } from "@/components/corretop-logo";
import { UserAvatar } from "@/components/ui/user-avatar";

type SidebarItem = { label: string; icon: typeof House; url: string; permission: PermissionKey };

// Categorized navigation groups as requested
const gestaoItems: SidebarItem[] = [
  { label: "Leads", icon: Users, url: "/leads", permission: "acessar_leads" },
  { label: "Clientes", icon: Handshake, url: "/clientes", permission: "acessar_clientes" },
  { label: "Unidades", icon: Buildings, url: "/filiais", permission: "gerenciar_filiais" },
  { label: "Equipe", icon: Users, url: "/equipe", permission: "convidar_corretor" },
  { label: "Metas", icon: Target, url: "/metas", permission: "gerenciar_metas" },
];

const operacaoItems: SidebarItem[] = [
  { label: "Resumo", icon: House, url: "/dashboard", permission: "acessar_dashboard" },
  { label: "Conversas", icon: ChatCircleText, url: "/conversas", permission: "acessar_conversas" },
  { label: "Tarefas", icon: ClipboardText, url: "/tarefas", permission: "acessar_tarefas" },
  { label: "Documentos", icon: Note, url: "/documentos", permission: "acessar_documentos" },
  { label: "NOC & Alertas", icon: Monitor, url: "/noc", permission: "ver_dashboard_equipe" },
];

const financeiroItems: SidebarItem[] = [
  { label: "Vendas", icon: CurrencyCircleDollar, url: "/vendas", permission: "acessar_vendas" },
  { label: "Comissões", icon: CurrencyCircleDollar, url: "/configuracoes/comissoes", permission: "gerenciar_comissoes" },
  { label: "Relatórios", icon: ChartBar, url: "/relatorios", permission: "acessar_relatorios" },
];

const sistemaItems: SidebarItem[] = [
  { label: "Importações Meta", icon: FileArrowDown, url: "/marketing/importacoes", permission: "ver_importacoes_meta" },
  { label: "Catálogo Global", icon: FolderSimple, url: "/catalogo", permission: "acessar_catalogo" },
  { label: "Materiais", icon: Megaphone, url: "/materiais-divulgacao", permission: "acessar_materiais_divulgacao" },
  { label: "Parâmetros", icon: SlidersHorizontal, url: "/settings", permission: "acessar_configuracoes_pessoais" },
  { label: "Guia do Sistema", icon: BookOpen, url: "/guia", permission: "acessar_guia" },
];

type GroupIcon = typeof House;

function NavigationGroup({
  label,
  icon,
  items,
  roleKey,
  jobTitle,
  groupIndex,
}: {
  label: string;
  icon?: GroupIcon;
  items: SidebarItem[];
  roleKey: UserDisplayInfo["roleKey"];
  jobTitle: UserDisplayInfo["jobTitle"];
  groupIndex: number;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleItems = roleKey
    ? items.filter((item) => {
        if (
          jobTitle === "marketing" &&
          [
            "/conversas",
            "/tarefas",
            "/documentos",
            "/clientes",
            "/vendas",
            "/checklist",
            "/minha-fila",
            "/dashboard",
            "/corretor",
            "/metas",
            "/relatorios",
            "/noc",
            "/filiais",
            "/unidades",
            "/gestor",
            "/diretor",
          ].some((path) => item.url === path || item.url.startsWith(path + "/"))
        ) {
          return false;
        }
        return hasCapability(roleKey, item.permission, jobTitle);
      })
    : [];

  if (visibleItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: [0, 0, 0.2, 1], delay: groupIndex * 0.06 }}
    >
      <SidebarCollapsibleGroup
        label={label}
        headerClassName="px-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
        icon={icon as unknown as React.ComponentType<React.SVGProps<SVGSVGElement> & { weight?: string; className?: string }>}
      >
        <SidebarMenu className="gap-1">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: groupIndex * 0.06 + index * 0.04 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive}
                    render={<Link href={item.url} onClick={() => isMobile && setOpenMobile(false)} prefetch />}
                    tooltip={item.label}
                    className="px-3.5 py-2 text-xs font-medium"
                  >
                    <Icon weight={isActive ? "fill" : "regular"} className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            );
          })}
        </SidebarMenu>
      </SidebarCollapsibleGroup>
    </motion.div>
  );
}

export function CorreTopSidebar({ logoUrl }: { logoUrl?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [user, setUser] = useState<UserDisplayInfo | null>(null);

  useEffect(() => {
    getUserDisplayInfo().then(setUser);
  }, []);

  const userName = user?.name ?? "Usuário";
  const userRole = user?.role ?? "";
  const roleKey = user?.roleKey ?? null;

  async function handleLogout() {
    toast.info("Encerrando sua sessão...");
    try {
      await signOut();
      toast.success("Sessão encerrada.");
      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 250);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sair agora.");
    }
  }

  const isPlantaoActive = pathname.startsWith("/leads/distribuicao/plantao");

  return (
    <Sidebar collapsible="icon" variant="sidebar" rail>
      <SidebarHeader className="border-b border-sidebar-border/50 py-3 pl-4 pr-3 space-y-3">
        <Link href="/dashboard" prefetch className="block">
          <CorreTopLogo src={logoUrl} className="h-8 w-full rounded-md object-contain object-left" />
        </Link>

        {/* Live Plantões Button Highlight */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isPlantaoActive}
              render={<Link href="/leads/distribuicao/plantao" onClick={() => isMobile && setOpenMobile(false)} prefetch />}
              tooltip="Plantão ao vivo"
              className="group/plantao relative flex h-10 w-full items-center justify-between rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-xs hover:border-amber-500/60 hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                </span>
                <span className="font-bold tracking-tight">PLANTÃO Ao Vivo</span>
              </div>
              <WifiHigh className="size-4 text-amber-500 group-hover/plantao:scale-110 transition-transform" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-3 space-y-3">
        <NavigationGroup items={gestaoItems} label="GESTÃO" icon={Users} roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={0} />
        <NavigationGroup items={operacaoItems} label="OPERAÇÃO" icon={Monitor} roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={1} />
        <NavigationGroup items={financeiroItems} label="FINANCEIRO" icon={CurrencyCircleDollar} roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={2} />
        <NavigationGroup items={sistemaItems} label="SISTEMA" icon={Gear} roleKey={roleKey} jobTitle={user?.jobTitle ?? null} groupIndex={3} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SidebarMenuButton size="lg" tooltip={userName}>
                  <UserAvatar seed={userName} name={userName} size="sm" className="size-7" />
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/55">{userRole}</span>
                  </span>
                  <SignOut className="ml-auto size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[var(--sidebar-width)]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <UserAvatar seed={userName} name={userName} size="sm" className="size-8" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{userName}</span>
                        <span className="text-xs text-muted-foreground">{userRole}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {roleKey && hasCapability(roleKey, "acessar_configuracoes", user?.jobTitle ?? null) ? (
                  <DropdownMenuItem render={<Link href="/settings" prefetch />}>
                    <SlidersHorizontal className="size-4" />Configurações
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <SignOut className="size-4" />Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
