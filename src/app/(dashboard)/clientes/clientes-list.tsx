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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

/* ─── Metric Card ─── */

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  chart,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
  trend?: "up" | "down";
  chart?: { total: string | number; label: string; segments: Array<{ name: string; value: number; color: string }> };
  color?: string;
}) {
  return (
    <Card className="rounded-xl border-border/70 bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm hover:shadow-primary/5">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex size-7 items-center justify-center rounded-lg", color ? `${color}/10` : "bg-primary/10")}>
              <Icon className={cn("size-3.5", color ?? "text-primary")} />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          {trend && (
            <Badge className="rounded-md text-[10px]" variant={trend === "up" ? "success" : "destructive"}>
              <TrendUp className="size-2.5" />
              {trend === "up" ? "+" : "-"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{sublabel}</p>
        </div>
        {chart ? <MiniDonut {...chart} /> : null}
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
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
        <Handshake className="size-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Nenhum cliente encontrado</p>
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
    <div className="flex flex-col gap-5">
      <section aria-label="Indicadores de clientes" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={Handshake}
          label="Total de clientes"
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
          color="text-primary"
        />
        <MetricCard
          icon={TrendUp}
          label="Taxa de conversão"
          value={`${metrics.conversionRate}%`}
          sublabel={`${metrics.totalClients} cliente${metrics.totalClients !== 1 ? "s" : ""} convertidos`}
          trend={Number.parseFloat(metrics.conversionRate) > 10 ? "up" : "down"}
          chart={{
            total: `${metrics.conversionRate}%`,
            label: "conversão",
            segments: [
              { name: "convertidos", value: Number.parseFloat(metrics.conversionRate), color: "var(--chart-4)" },
              { name: "restante", value: Math.max(0, 100 - Number.parseFloat(metrics.conversionRate)), color: "var(--muted)" },
            ]
          }}
          color="text-chart-4"
        />
        <MetricCard
          icon={Users}
          label="Média por corretor"
          value={String(metrics.avgClientsPerBroker)}
          sublabel={`${metrics.totalBrokers} corretor${metrics.totalBrokers !== 1 ? "es" : ""} com clientes`}
          chart={{
            total: metrics.avgClientsPerBroker,
            label: "média",
            segments: [
              { name: "corretores", value: metrics.totalBrokers, color: "var(--chart-3)" },
            ]
          }}
          color="text-chart-3"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Renovações próximas"
          value={String(metrics.upcomingRenewals)}
          sublabel="aniversário de contrato nos próximos 30 dias"
          trend={metrics.upcomingRenewals > 0 ? "up" : "down"}
          chart={{
            total: metrics.upcomingRenewals,
            label: "renovações",
            segments: metrics.upcomingRenewals > 0
              ? [{ name: "pendentes", value: metrics.upcomingRenewals, color: "var(--warning)" }]
              : []
          }}
          color="text-warning"
        />
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar clientes"
            className="h-8 bg-muted/50 pl-8 text-xs"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone, corretor..."
            value={search}
          />
        </div>
        <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
          {filtered.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card className="border-border/70 bg-card shadow-none">
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Conversão</TableHead>
                  <TableHead className="w-[80px] pr-5 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => {
                  const convertedDate = new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(client.convertedAt);

                  return (
                    <TableRow key={client.id} className="group/row hover:bg-muted/30">
                      <TableCell className="pl-5 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{client.name}</span>
                          <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-medium text-muted-foreground/60">
                            Cliente
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col text-xs text-muted-foreground">
                          {client.email && <span className="truncate max-w-[200px]">{client.email}</span>}
                          <span>{client.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <OwnershipContext
                          brokerName={client.brokerName}
                          branchName={client.branchName}
                          className="text-xs text-muted-foreground/75"
                        />
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground/60 tabular-nums">
                        {convertedDate}
                      </TableCell>
                      <TableCell className="pr-5 py-3 text-right">
                        <Button
                          render={<Link href={`/clientes/${client.id}`} />}
                          size="xs"
                          variant="ghost"
                          className="opacity-0 group-hover/row:opacity-100 transition-all duration-150"
                        >
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
