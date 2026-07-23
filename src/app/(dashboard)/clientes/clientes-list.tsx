"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

import {
  ArrowRight,
  CalendarCheck,
  Handshake,
  MagnifyingGlass,
  TrendUp,
  Users,
} from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MiniDonut } from "@/components/dashboard/mini-donut";
import { OwnershipContext } from "@/components/ownership-context";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ─── Types ─── */

type ClientItem = {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email: string | null;
  convertedAt: Date;
  brokerName: string | null;
  branchName: string | null;
};

type ClientsMetrics = {
  totalClients: number;
  conversionRate: string;
  avgClientsPerBroker: number;
  upcomingRenewals: number;
  recentConversions: number;
  totalBrokers: number;
};

/* ─── Refined Metric Card ─── */

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  chart,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
  trend?: "up" | "down";
  chart?: { total: string | number; label: string; segments: Array<{ name: string; value: number; color: string }> };
  iconColor?: string;
}) {
  return (
    <Card className="group/card rounded-xl border-border bg-card shadow-xs transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary", iconColor)}>
              <Icon className="size-4" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
          </div>
          {trend && (
            <Badge className="rounded-md text-[10px] px-1.5 py-0.5" variant={trend === "up" ? "success" : "destructive"}>
              <TrendUp className="mr-0.5 size-2.5" />
              {trend === "up" ? "Alta" : "Atenção"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-tight font-mono text-foreground">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">{sublabel}</p>
        </div>
        {chart ? <MiniDonut size="md" {...chart} /> : null}
      </CardContent>
    </Card>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
        <Handshake className="size-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Nenhum cliente encontrado</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Os leads convertidos aparecerão aqui automaticamente.</p>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

export function ClientesList({
  clients,
  metrics,
}: {
  clients: ClientItem[];
  metrics: ClientsMetrics;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return clients;
    return clients.filter(
      (client) =>
        client.name.toLocaleLowerCase("pt-BR").includes(query) ||
        (client.email?.toLocaleLowerCase("pt-BR").includes(query) ?? false) ||
        client.phone.includes(query) ||
        (client.brokerName?.toLocaleLowerCase("pt-BR").includes(query) ?? false) ||
        (client.branchName?.toLocaleLowerCase("pt-BR").includes(query) ?? false),
    );
  }, [clients, search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Section */}
      <section aria-label="Indicadores de clientes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Handshake}
          label="Total de Clientes"
          value={String(metrics.totalClients)}
          sublabel={`${metrics.recentConversions} convertidos nos últimos 30 dias`}
          chart={{
            total: metrics.totalClients,
            label: "clientes",
            segments: [
              { name: "recentes", value: metrics.recentConversions, color: "var(--chart-2)" },
              { name: "demais", value: Math.max(0, metrics.totalClients - metrics.recentConversions), color: "var(--primary)" },
            ]
          }}
          iconColor="bg-primary/10 text-primary"
        />
        <MetricCard
          icon={TrendUp}
          label="Taxa de Conversão"
          value={`${metrics.conversionRate}%`}
          sublabel={`${metrics.totalClients} cliente(s) convertidos no pipeline`}
          trend={Number.parseFloat(metrics.conversionRate) > 10 ? "up" : "down"}
          chart={{
            total: `${metrics.conversionRate}%`,
            label: "taxa",
            segments: [
              { name: "convertidos", value: Number.parseFloat(metrics.conversionRate), color: "hsl(217 91% 60%)" },
              { name: "restante", value: Math.max(0, 100 - Number.parseFloat(metrics.conversionRate)), color: "var(--muted)" },
            ]
          }}
          iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          icon={Users}
          label="Média por Corretor"
          value={String(metrics.avgClientsPerBroker)}
          sublabel={`${metrics.totalBrokers} corretor(es) com carteira ativa`}
          chart={{
            total: metrics.avgClientsPerBroker,
            label: "média",
            segments: [
              { name: "carteira", value: metrics.avgClientsPerBroker, color: "hsl(270 60% 60%)" },
            ]
          }}
          iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Renovações Próximas"
          value={String(metrics.upcomingRenewals)}
          sublabel="Aniversário de contrato nos próximos 30 dias"
          trend={metrics.upcomingRenewals > 0 ? "up" : "down"}
          chart={{
            total: metrics.upcomingRenewals,
            label: "aniversário",
            segments: metrics.upcomingRenewals > 0
              ? [{ name: "pendentes", value: metrics.upcomingRenewals, color: "hsl(38 92% 50%)" }]
              : []
          }}
          iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </section>

      {/* Search and Table Container */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border/50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar clientes"
                className="h-9 bg-muted/40 pl-9 text-xs"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, telefone, corretor..."
                value={search}
              />
            </div>
            <p className="shrink-0 text-xs font-mono text-muted-foreground">
              {filtered.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider">Cliente</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Contato</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Responsável / Filial</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Data Conversão</TableHead>
                    <TableHead className="pr-5 text-right text-xs font-semibold uppercase tracking-wider">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => {
                    const initials = client.name
                      ? client.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "CL";

                    const convertedDate = new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(client.convertedAt));

                    return (
                      <TableRow key={client.id} className="group/row hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-5 py-3.5 font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 rounded-lg border border-primary/20 bg-primary/10 text-primary font-bold text-xs">
                              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-heading font-semibold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground leading-snug">{client.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-muted-foreground mt-0.5">
                                Cliente Ativo
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex flex-col text-xs text-muted-foreground">
                            {client.email && <span className="font-mono text-foreground/80 truncate max-w-[220px]">{client.email}</span>}
                            <span className="font-mono">{client.phone}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <OwnershipContext
                            brokerName={client.brokerName}
                            branchName={client.branchName}
                            className="text-xs text-muted-foreground"
                          />
                        </TableCell>

                        <TableCell className="py-3.5 text-xs text-muted-foreground font-mono">
                          {convertedDate}
                        </TableCell>

                        <TableCell className="pr-5 py-3.5 text-right">
                          <Button
                            render={<Link href={`/clientes/${client.id}`} />}
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs opacity-80 group-hover/row:opacity-100 transition-all"
                          >
                            Ver Perfil <ArrowRight className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
