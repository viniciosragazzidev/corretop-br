"use client";

import {
  ArrowsDownUp,
  Calculator,
  CalendarCheck,
  ChartBar,
  ChartLineUp,
  ClipboardText,
  CurrencyCircleDollar,
  FileArrowDown,
  Gear,
  PiggyBank,
  SignOut,
  Target,
  TrendDown,
  TrendUp,
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
import { signOut } from "@/shared/auth/client";
import { toast } from "sonner";
import { getUserDisplayInfo, type UserDisplayInfo } from "@/shared/auth/actions";

const overviewItems = [
  { label: "Dashboard Financeiro", icon: ChartLineUp, url: "/financeiro" },
  { label: "Fluxo de Caixa", icon: CurrencyCircleDollar, url: "/financeiro/fluxo-caixa" },
  { label: "Extrato", icon: ClipboardText, url: "/financeiro/extrato" },
];

const commissionItems = [
  { label: "Comissões", icon: TrendUp, url: "/financeiro/comissoes" },
  { label: "Repasses", icon: ArrowsDownUp, url: "/financeiro/repasses" },
  { label: "Taxas & Custos", icon: TrendDown, url: "/financeiro/taxas" },
];

const goalsItems = [
  { label: "Metas Financeiras", icon: Target, url: "/financeiro/metas" },
  { label: "Resultado por Corretor", icon: Calculator, url: "/financeiro/resultado-corretor" },
  { label: "Comissionamento", icon: PiggyBank, url: "/financeiro/comissionamento" },
];

const reportsItems = [
  { label: "Relatórios", icon: ChartBar, url: "/financeiro/relatorios" },
  { label: "Exportar Dados", icon: FileArrowDown, url: "/financeiro/exportar" },
  { label: "Cronograma de Repasses", icon: CalendarCheck, url: "/financeiro/cronograma" },
];

const settingsItems = [
  { label: "Configurações", icon: Gear, url: "/financeiro/configuracoes" },
];

const groupNames = ["Visão geral", "Comissões", "Metas", "Relatórios", "Configurações"] as const;

function NavigationGroup({
  label,
  items,
  groupIndex,
}: {
  label: string;
  items: typeof overviewItems;
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
            {items.map((item, index) => {
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

export function CorreTopFinanceiroSidebar() {
  const router = useRouter();
  const [user, setUser] = useState<UserDisplayInfo | null>(null);

  useEffect(() => {
    getUserDisplayInfo().then(setUser);
  }, []);

  const userName = user?.name ?? "Usuário";
  const userRole = user?.role ?? "";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  return (
    <Sidebar collapsible="icon" variant="sidebar" rail>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10" size="lg" render={<Link href="/financeiro" prefetch />}>
              <span className="grid size-7 place-items-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                $
              </span>
              <span className="truncate font-semibold tracking-tight">Financeiro</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mx-2 rounded-md border border-sidebar-border bg-sidebar-accent/45 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] text-sidebar-foreground/55">Área financeira</p>
          <p className="mt-0.5 truncate text-sm font-medium">{userRole || "Gestão Financeira"}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavigationGroup items={overviewItems} label="Visão geral" groupIndex={0} />
        <NavigationGroup items={commissionItems} label="Comissões" groupIndex={1} />
        <NavigationGroup items={goalsItems} label="Metas" groupIndex={2} />
        <NavigationGroup items={reportsItems} label="Relatórios" groupIndex={3} />
        <NavigationGroup items={settingsItems} label="Configurações" groupIndex={4} />
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
