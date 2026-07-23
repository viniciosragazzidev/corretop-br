"use client"

import { ArrowRight, Bell, BellRinging, MagnifyingGlass, Plus } from "@/components/huge-icons"
import { type CSSProperties, type ReactNode, useMemo, useState } from "react"

import { CorretorSidebar } from "@/components/corretor-sidebar"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ThemeToggle } from "@/components/theme-toggle"
import { AvailabilityToggle } from "./availability-toggle"
import type { BrokerDashboardData } from "@/app/(dashboard)/dashboard/data"

import { LeadStatusBadge } from "@/components/status-badges"

function DashboardShell({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  if (embedded) return <>{children}</>
  return <SidebarProvider style={{ "--sidebar-width": "17.5rem", "--header-height": "3.75rem" } as CSSProperties}><CorretorSidebar /><SidebarInset className="bg-[var(--dashboard-canvas)]">{children}</SidebarInset></SidebarProvider>
}

export function BrokerResumeDashboard({ embedded = false, data }: { embedded?: boolean; data: BrokerDashboardData }) {
  const [search, setSearch] = useState("")
  const filteredLeads = useMemo(() => { const query = search.trim().toLocaleLowerCase("pt-BR"); return query ? data.leads.filter((lead) => `${lead.name} ${lead.phone} ${lead.status}`.toLocaleLowerCase("pt-BR").includes(query)) : data.leads }, [data.leads, search])
  const metrics = [
    { label: "Leads na carteira", value: String(data.totals.all), change: `${data.totals.active} ativos`, sublabel: "dados do seu tenant", trend: "up" as const, chartSegments: [{ name: "ativos", value: data.totals.active, color: "var(--primary)" }, { name: "fechados", value: data.totals.converted, color: "var(--chart-2)" }] },
    { label: "Novos leads", value: String(data.totals.new), change: "aguardando contato", sublabel: "fila pessoal", trend: "up" as const, chartSegments: [{ name: "novos", value: data.totals.new, color: "var(--chart-3)" }, { name: "restante", value: Math.max(0, data.totals.all - data.totals.new), color: "var(--muted)" }] },
    { label: "Em atendimento", value: String(data.totals.inContact), change: "status atual", sublabel: "contatos em andamento", trend: "up" as const, chartSegments: [{ name: "contato", value: data.totals.inContact, color: "var(--chart-4)" }, { name: "restante", value: Math.max(0, data.totals.all - data.totals.inContact), color: "var(--muted)" }] },
  ]
  return <DashboardShell embedded={embedded}>
    <div className="mx-4 mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary lg:mx-6"><span className="size-2 rounded-full bg-primary" /> Unidade: {data.branchName}</div>
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6"><SidebarTrigger /><div className="h-4 w-px bg-border" /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Corretor / Resumo</p><h1 className="truncate text-sm font-semibold">Minha operação</h1></div><div className="relative hidden w-60 md:block"><MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar na minha fila" className="h-8 bg-muted pl-8" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar minha fila" value={search} /></div><ThemeToggle /><Button aria-label="Notificações pessoais" size="icon" variant="ghost"><Bell /></Button></header>
    <div className="flex flex-1 flex-col gap-5 p-4 lg:gap-6 lg:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-medium text-primary">DADOS REAIS</p><h2 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">Olá, {data.userName.split(" ")[0]}.</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe sua carteira pelo módulo de Leads.</p></div><div className="flex flex-wrap items-center gap-2"><AvailabilityToggle initialStatus={data.availabilityStatus} /><Button render={<a href="/leads" />} size="sm"><Plus weight="bold" /> Novo lead</Button></div></div>
      {data.activeLeads.length ? <Card className="border-emerald-500/15 bg-emerald-500/5 shadow-none"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"><BellRinging size={18} weight="bold" /></span><div><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Atendimento ativo</p><p className="mt-1 text-sm text-muted-foreground">Você está responsável por {data.activeLeads.length} {data.activeLeads.length === 1 ? "lead" : "leads"}. Mantenha o contato e avance o status.</p><div className="mt-2 flex flex-wrap gap-1.5">{data.activeLeads.slice(0, 3).map((lead) => <Badge className="border-emerald-500/15 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15" key={lead.id} variant="outline">{lead.name}</Badge>)}{data.activeLeads.length > 3 ? <Badge variant="outline">+{data.activeLeads.length - 3}</Badge> : null}</div></div></div><Button render={<a href="/leads" />} size="sm" variant="outline">Ver meus atendimentos <ArrowRight /></Button></CardContent></Card> : null}
      <section aria-label="Minha carteira" className="grid gap-4 md:grid-cols-3">{metrics.map((metric) => <MetricCard {...metric} key={metric.label} />)}</section>
      <section id="minha-fila"><Card className="border-border bg-card shadow-none"><CardHeader className="flex-row items-center justify-between gap-4 border-b border-border pb-4"><div><CardTitle>Minha fila</CardTitle><CardDescription>Leads atribuídos a você. Abra um lead para iniciar o atendimento.</CardDescription></div><Badge variant="outline">{filteredLeads.length} leads</Badge></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-5">Lead</TableHead><TableHead>Status</TableHead><TableHead>Origem</TableHead><TableHead>Última interação</TableHead><TableHead className="pr-5 text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{filteredLeads.map((lead) => <TableRow key={lead.id}><TableCell className="pl-5"><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.phone}</p></TableCell><TableCell><LeadStatusBadge status={lead.status} /></TableCell><TableCell>{lead.source === "webhook" ? "Automático" : "Manual"}</TableCell><TableCell className="text-xs text-muted-foreground">{lead.lastInteractionAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(lead.lastInteractionAt) : "Sem interação"}</TableCell><TableCell className="pr-5 text-right"><Button render={<a href={`/leads/${lead.id}`} />} size="sm" variant="ghost">Abrir <ArrowRight /></Button></TableCell></TableRow>)}</TableBody></Table>{!filteredLeads.length ? <p className="p-6 text-sm text-muted-foreground">Nenhum lead corresponde à busca.</p> : null}</CardContent></Card></section>
    </div>
  </DashboardShell>
}
