"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building06Icon, LinkSquare01Icon, SecurityCheckIcon, UserIcon, Store01Icon } from "@hugeicons/core-free-icons";

export type TabId = "conta" | "empresa" | "unidade" | "whatsapp" | "integracoes" | "seguranca";
type Tab = { id: TabId; label: string; icon: typeof UserIcon };

export function SettingsTabs({ account, company, unit, whatsapp, integrations, security, tabIds }: { account: ReactNode; company?: ReactNode; unit?: ReactNode; whatsapp: ReactNode; integrations?: ReactNode; security: ReactNode; tabIds: TabId[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allTabs: Tab[] = [
    { id: "conta", label: "Minha conta", icon: UserIcon },
    { id: "empresa", label: "Empresa", icon: Building06Icon },
    { id: "unidade", label: "Unidade", icon: Store01Icon },
    { id: "whatsapp", label: "WhatsApp", icon: LinkSquare01Icon },
    { id: "integracoes", label: "Integrações", icon: LinkSquare01Icon },
    { id: "seguranca", label: "Segurança", icon: SecurityCheckIcon },
  ];
  const tabs = allTabs.filter((tab) => tabIds.includes(tab.id));
  const requested = searchParams.get("tab") as TabId | null;
  const active = tabs.some((tab) => tab.id === requested) ? requested! : tabs[0]?.id ?? "conta";

  function selectTab(tabId: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return <div className="grid gap-4 lg:grid-cols-[13rem_1fr]"><nav className="flex gap-1 overflow-x-auto lg:flex-col">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => selectTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><HugeiconsIcon icon={tab.icon} size={16} />{tab.label}</button>)}</nav><div className="min-w-0">{active === "conta" ? account : null}{active === "empresa" ? company : null}{active === "unidade" ? unit : null}{active === "whatsapp" ? whatsapp : null}{active === "integracoes" ? integrations : null}{active === "seguranca" ? security : null}</div></div>;
}
