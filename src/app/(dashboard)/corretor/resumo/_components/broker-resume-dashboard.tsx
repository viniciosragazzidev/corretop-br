"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bell, BellRinging, ChatCircleText, CheckCircle, MagnifyingGlass, Plus } from "@/components/huge-icons";

import { CorretorSidebar } from "@/components/corretor-sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvailabilityToggle } from "./availability-toggle";
import type { BrokerDashboardData } from "@/app/(dashboard)/dashboard/data";
import { LeadStatusBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/ui/user-avatar";

function DashboardShell({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  if (embedded) return <>{children}</>;
  return (
    <SidebarProvider style={{ "--sidebar-width": "17.5rem", "--header-height": "3.75rem" } as CSSProperties}>
      <CorretorSidebar />
      <SidebarInset className="bg-[var(--dashboard-canvas)]">{children}</SidebarInset>
    </SidebarProvider>
  );
}

export function BrokerResumeDashboard({ embedded = false, data }: { embedded?: boolean; data: BrokerDashboardData }) {
  const [search, setSearch] = useState("");
  const firstName = data.userName.split(" ")[0] || "Corretor";

  const nextActionLead = useMemo(() => {
    return data.activeLeads[0] ?? data.leads.find((l) => l.status === "new" || l.status === "in_contact") ?? null;
  }, [data.activeLeads, data.leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return query
      ? data.leads.filter((lead) => `${lead.name} ${lead.phone} ${lead.status}`.toLocaleLowerCase("pt-BR").includes(query))
      : data.leads;
  }, [data.leads, search]);

  const metrics = [
    {
      label: "Leads na carteira",
      value: String(data.totals.all),
      change: `${data.totals.active} ativos`,
      sublabel: "carteira pessoal",
      trend: "up" as const,
      chartSegments: [
        { name: "ativos", value: data.totals.active, color: "var(--primary)" },
        { name: "fechados", value: data.totals.converted, color: "var(--chart-2)" },
      ],
    },
    {
      label: "Novos leads",
      value: String(data.totals.new),
      change: "aguardando primeiro contato",
      sublabel: "fila prioritária",
      trend: "up" as const,
      chartSegments: [
        { name: "novos", value: data.totals.new, color: "var(--chart-3)" },
        { name: "restante", value: Math.max(0, data.totals.all - data.totals.new), color: "var(--muted)" },
      ],
    },
    {
      label: "Em atendimento",
      value: String(data.totals.inContact),
      change: "em negociação ativa",
      sublabel: "contatos em andamento",
      trend: "up" as const,
      chartSegments: [
        { name: "contato", value: data.totals.inContact, color: "var(--chart-4)" },
        { name: "restante", value: Math.max(0, data.totals.all - data.totals.inContact), color: "var(--muted)" },
      ],
    },
  ];

  return (
    <DashboardShell embedded={embedded}>
      <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Corretor / Resumo</p>
          <h1 className="truncate text-sm font-semibold">Minha Operação</h1>
        </div>
        <div className="relative hidden w-60 md:block">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar na minha fila"
            className="h-8 bg-muted pl-8 text-xs"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar minha fila..."
            value={search}
          />
        </div>
        <ThemeToggle />
        <Button aria-label="Notificações pessoais" size="icon" variant="ghost">
          <Bell className="size-4" />
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* Header Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar seed={data.userName} name={data.userName} size="lg" className="size-12 rounded-xl" />
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Bom dia, {firstName} 👋</h2>
              <p className="text-xs text-muted-foreground">
                Unidade <strong className="font-semibold text-foreground">{data.branchName}</strong> · Foco total na próxima conversão.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityToggle initialStatus={data.availabilityStatus} />
            <Button render={<Link href="/leads" />} size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <Plus className="size-4" /> Novo Lead
            </Button>
          </div>
        </div>

        {/* ─── 1. HERO CARD PRINCIPAL (Único Card de Destaque Primário) ─── */}
        {nextActionLead ? (
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-md">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-white/30 bg-white/20 text-white font-mono text-[10px] uppercase tracking-wider">
                    <CheckCircle className="mr-1 size-3" /> Próxima Ação Recomendada
                  </Badge>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  Iniciar contato com {nextActionLead.name}
                </h3>
                <p className="text-xs text-white/80">
                  {nextActionLead.status === "new"
                    ? "Lead novo aguardando primeiro contato comercial imediato."
                    : "Atendimento em andamento. Avance para proposta ou agendamento de retorno."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  render={<Link href={`/leads/${nextActionLead.id}`} />}
                  size="default"
                  className="h-10 bg-white text-primary hover:bg-white/90 font-bold shadow-sm text-xs gap-2"
                >
                  <ChatCircleText className="size-4" /> Atender Agora <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Sua fila está em dia!</p>
                  <p className="text-xs text-muted-foreground">Nenhum atendimento pendente no momento. Fique atento às notificações.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── 2. MÉTRICAS NEUTRAS (Fundo Padrão) ─── */}
        <section aria-label="Minha carteira" className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric, i) => (
            <MetricCard {...metric} key={metric.label} animated animationDelay={i * 0.08} />
          ))}
        </section>

        {/* ─── 3. MINHA FILA (Tabela de Atendimento) ─── */}
        <section id="minha-fila">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border/50 p-4">
              <div>
                <CardTitle className="text-base font-bold">Minha Fila de Atendimento</CardTitle>
                <CardDescription className="text-xs">
                  Selecione um lead para abrir a ficha completa e registrar a próxima etapa.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredLeads.length} leads
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-4 text-xs font-semibold">Lead</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Origem</TableHead>
                    <TableHead className="text-xs font-semibold">Última Interação</TableHead>
                    <TableHead className="pr-4 text-right text-xs font-semibold">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar seed={lead.name} name={lead.name} size="sm" className="size-7" />
                          <div>
                            <p className="font-semibold text-xs text-foreground">{lead.name}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">{lead.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.source === "webhook" ? "Meta Ads" : "Manual"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {lead.lastInteractionAt
                          ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                              lead.lastInteractionAt
                            )
                          : "Sem interação"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button render={<Link href={`/leads/${lead.id}`} />} size="sm" variant="ghost" className="h-8 text-xs gap-1">
                          Abrir <ArrowRight className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filteredLeads.length && (
                <p className="p-6 text-center text-xs text-muted-foreground">Nenhum lead encontrado para a busca.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
