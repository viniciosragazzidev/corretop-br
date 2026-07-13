"use client";

import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building06Icon, Settings01Icon, LinkSquare01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";

const tabs = [
  { id: "empresa", label: "Empresa", icon: Building06Icon },
  { id: "sistema", label: "Sistema", icon: Settings01Icon },
  { id: "integracoes", label: "Integrações", icon: LinkSquare01Icon },
  { id: "seguranca", label: "Segurança", icon: SecurityCheckIcon },
] as const;

export function SettingsTabs({ children, integrations, security, integrationsLocked = false }: { children: ReactNode; integrations?: ReactNode; security?: ReactNode; integrationsLocked?: boolean }) {
  const [active, setActive] = useState("empresa");
  const visibleTabs = integrations || integrationsLocked ? tabs : tabs.filter((tab) => tab.id !== "integracoes");

  return (
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <nav className="flex gap-1 lg:flex-col">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0">
        {active === "empresa" && children}
        {active === "sistema" && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Configurações do sistema em breve.
          </div>
        )}
        {active === "integracoes" ? integrations ?? <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">As integrações de captura e tokens ficam bloqueadas para este papel. O acesso ao WhatsApp operacional está disponível no botão acima.</div> : null}
        {active === "seguranca" ? security : null}
      </div>
    </div>
  );
}
