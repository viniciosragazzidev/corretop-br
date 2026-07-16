"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChartBar,
  CheckCircle,
  Circle,
  Globe,
  SealCheck,
  Users,
  UserList,
  Warning,
  WifiHigh,
  XCircle,
} from "@/components/huge-icons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardItemVariants } from "@/shared/animations";
import type {
  DirectorDashboardData,
  ManagerDashboardData,
  BrokerDashboardData,
} from "../data";

// ─── Props ──────────────────────────────────────────────────────────────────

type RoleProps =
  | { role: "director"; data: DirectorDashboardData }
  | { role: "manager"; data: ManagerDashboardData }
  | { role: "broker"; data: BrokerDashboardData };

// ─── Status Helper ───────────────────────────────────────────────────────────

function StatusIndicator({
  status,
}: {
  status: "operational" | "degraded" | "down";
}) {
  if (status === "operational")
    return <SealCheck className="size-4 text-success" weight="fill" />;
  if (status === "degraded")
    return <Warning className="size-4 text-warning" weight="fill" />;
  return <XCircle className="size-4 text-destructive" weight="fill" />;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "conversion":
      return (
        <CheckCircle className="size-3.5 text-success" weight="fill" />
      );
    case "new_lead":
      return <Users className="size-3.5 text-chart-3" weight="fill" />;
    case "alert":
      return <Warning className="size-3.5 text-warning" weight="fill" />;
    default:
      return (
        <Circle className="size-3.5 text-muted-foreground" weight="fill" />
      );
  }
}

function DirectorActionCenter({ data }: { data: DirectorDashboardData }) {
  const actions = [
    {
      label: "Leads sem contato",
      value: data.totals.unworked,
      description: "Distribuídos há mais de 15 minutos",
      href: "/leads?status=distributed",
      tone: data.totals.unworked > 0 ? "border-warning/30 bg-accent/[0.06]" : "border-border/60 bg-muted/20",
      icon: Warning,
    },
    {
      label: "Leads estagnados",
      value: data.totals.stalled,
      description: "Sem avanço há mais de 3 dias",
      href: "/leads?status=stalled",
      tone: data.totals.stalled > 0 ? "border-destructive/30 bg-destructive/[0.05]" : "border-border/60 bg-muted/20",
      icon: XCircle,
    },
    {
      label: "Equipe ativa",
      value: `${data.totals.activeBrokers}/${data.totals.members}`,
      description: "Membros ativos no tenant",
      href: "/equipe",
      tone: "border-border/60 bg-muted/20",
      icon: Users,
    },
    {
      label: "Configuração",
      value: "Revisar",
      description: "Marca, integrações e segurança",
      href: "/settings",
      tone: "border-border/60 bg-muted/20",
      icon: Globe,
    },
  ] as const;

  return (
    <section aria-labelledby="director-action-center" className="space-y-3">
      <div>
        <h2 id="director-action-center" className="text-base font-semibold tracking-tight">Atenção agora</h2>
        <p className="mt-1 text-sm text-muted-foreground">Comece pelo que pode afetar atendimento, equipe ou configuração.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className={`group rounded-xl border p-4 outline-none transition-colors hover:border-primary/30 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${action.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <Icon className="size-4 text-muted-foreground" weight="fill" />
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-[var(--duration-quick)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-sm font-medium">{action.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{action.value}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function NocMetricCard({
  label,
  value,
  change,
  description,
  delay,
}: {
  label: string;
  value: string | number;
  change: string;
  description: string;
  delay: number;
}) {
  const isUp = !change.startsWith("-");
  return (
    <motion.div
      variants={cardItemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: delay / 1000 }}
    >
      <Card className="group/card rounded-xl border-border/70 bg-card shadow-none transition-all duration-200">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{label}</span>
            <Badge
              className="rounded-md text-xs font-medium transition-transform duration-200 group-hover/card:scale-105"
              variant={isUp ? "success" : "destructive"}
            >
              <ArrowUpRight className="mr-0.5 size-3 transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" weight="bold" />
              {change}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground/70">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Chart Tooltip ───────────────────────────────────────────────────────────

function ChartTooltipWrapper({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

function ActivityFeed({
  activities,
}: {
  activities: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
    user: string;
    branchName?: string | null;
  }>;
}) {
  return (
    <Card className="rounded-xl border-border/70 bg-card shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Movimentações da operação</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1.5 rounded-md text-xs">
            <ChartBar className="size-3" weight="fill" />
            Tempo real
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-72 overflow-y-auto">
          <div className="space-y-0">
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 border-b border-border/40 px-6 py-3.5 transition-colors last:border-0 hover:bg-muted/20"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-muted/60">
                  <ActivityIcon type={activity.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.user}</span>
                    {activity.branchName && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-foreground/70">{activity.branchName}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Director Dashboard ──────────────────────────────────────────────────────

function DirectorNocContent({ data }: { data: DirectorDashboardData }) {
  const funnelChartData = data.funnel.map((f) => ({
    name: f.stage,
    volume: f.volume,
  }));
  const totalLeads = data.totals.leads;
  const totalConverted = data.totals.converted;
  const conversionRate =
    totalLeads > 0
      ? ((totalConverted / totalLeads) * 100).toFixed(1)
      : "0,0";

  const statusDistribution = [
    {
      name: "Novos",
      value: data.funnel.find((f) => f.stage === "Novo")?.volume ?? 0,
      color: "var(--chart-1)",
    },
    {
      name: "Contato",
      value: data.funnel.find((f) => f.stage === "Contato")?.volume ?? 0,
      color: "var(--chart-2)",
    },
    {
      name: "Cotação",
      value: data.funnel.find((f) => f.stage === "Cotação")?.volume ?? 0,
      color: "var(--chart-3)",
    },
    {
      name: "Negociação",
      value:
        data.funnel.find((f) => f.stage === "Negociação")?.volume ?? 0,
      color: "var(--chart-4)",
    },
    {
      name: "Conversão",
      value:
        data.funnel.find((f) => f.stage === "Conversão")?.volume ?? 0,
      color: "var(--chart-5)",
    },
  ];

  const activities: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
    user: string;
  }> = [
      {
        id: 1,
        type: "alert",
        message: `${data.totals.unworked} leads não trabalhados há mais de 15 min`,
        time: "agora",
        user: "Alerta",
      },
      {
        id: 2,
        type: "alert",
        message: `${data.totals.stalled} leads estagnados sem avanço`,
        time: "agora",
        user: "Alerta",
      },
      {
        id: 3,
        type: "conversion",
        message: `${totalConverted} leads convertidos no total`,
        time: "hoje",
        user: "Sistema",
      },
      ...data.branches.map((b, i) => ({
        id: 10 + i,
        type: "new_lead" as const,
        message: `Filial "${b.name}" — ${b.leads} leads, ${b.conversion} conversão`,
        time: "hoje",
        user: "Sistema",
        branchName: b.name,
      })),
    ];

  return (
    <>
      {/* Status Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
            <SealCheck className="size-5 text-success" weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {data.tenant.name} — Operacional
            </h2>
            <p className="text-xs text-muted-foreground">
              {data.totals.activeBrokers} de {data.totals.members}
              {data.totals.members === 1 ? " membro ativo" : " membros ativos"}{" "}
              · {data.totals.branches}{" "}
              {data.totals.branches === 1 ? "filial" : "filiais"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md text-xs font-normal"
          >
            <StatusIndicator status="operational" />
            {totalLeads} leads
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md text-xs font-normal"
          >
            <StatusIndicator
              status={totalConverted > 0 ? "operational" : "degraded"}
            />
            {totalConverted} conversões
          </Badge>
        </div>
      </section>

      <DirectorActionCenter data={data} />

      {/* Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <NocMetricCard
          label="Leads"
          value={data.totals.leads}
          change={`${data.totals.activeLeads} ativos`}
          description="Total de leads no tenant"
          delay={0}
        />
        <NocMetricCard
          label="Ativos"
          value={data.totals.activeLeads}
          change={`${((data.totals.activeLeads / Math.max(1, data.totals.leads)) * 100).toFixed(0)}%`}
          description="Leads em atendimento"
          delay={80}
        />
        <NocMetricCard
          label="Conversões"
          value={data.totals.converted}
          change={data.totals.leads > 0 ? `${conversionRate}%` : "0%"}
          description="Leads convertidos"
          delay={160}
        />
        <NocMetricCard
          label="Corretores"
          value={data.totals.activeBrokers}
          change={`${data.totals.members} cadastrados`}
          description="Membros ativos na operação"
          delay={240}
        />
        <NocMetricCard
          label="Filial"
          value={data.totals.branches}
          change={`${data.totals.unworked} não trab.`}
          description="Unidades cadastradas"
          delay={320}
        />
      </section>        {/* Charts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Funnel Flow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
          className="lg:col-span-4"
        >
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Funil Comercial</CardTitle>
                  <CardDescription>
                    Leads por etapa no tenant
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {funnelChartData.map((d) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1.5"
                    >
                      <span className="inline-block size-2.5 rounded-full bg-primary" />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart
                    data={funnelChartData}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="funnelGradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltipWrapper />}
                      cursor={{
                        stroke: "var(--border)",
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Area
                      dataKey="volume"
                      fill="url(#funnelGradient)"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      type="monotone"
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0, 0, 0.2, 1], delay: 0.08 }}
          className="lg:col-span-3"
        >
          <Card className="rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>
                Leads em cada etapa do funil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center">
                <div className="relative">
                  <ResponsiveContainer height={180} width={220}>
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={statusDistribution.filter((d) => d.value > 0)}
                        dataKey="value"
                        endAngle={-270}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        strokeWidth={0}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {statusDistribution
                          .filter((d) => d.value > 0)
                          .map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipWrapper />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold tabular-nums">
                      {totalLeads}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Total
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {statusDistribution
                  .filter((d) => d.value > 0)
                  .map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">
                        {item.name}
                      </span>
                      <span className="ml-auto font-medium tabular-nums">
                        {item.value}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Branches Performance */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-4">
          <CardHeader>
            <CardTitle>Desempenho por Filial</CardTitle>
            <CardDescription>
              Leads, ativos e conversão por unidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.branches.map((branch, i) => (
              <motion.div
                key={branch.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.06, 0.3) }}
                className="rounded-lg border border-border/40 bg-muted/20 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {branch.name}
                  </span>
                  <Badge variant="outline" className="rounded-md text-xs">
                    {branch.conversion}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{branch.leads} leads</span>
                  <span>·</span>
                  <span>{branch.activeLeads} ativos</span>
                  <span>·</span>
                  <span>{branch.conversion} conversão</span>
                </div>
                <div className="mt-2 relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-5 transition-all duration-700"
                    style={{
                      width: `${branch.leads > 0
                        ? (branch.activeLeads / branch.leads) * 100
                        : 0
                        }%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
            {data.branches.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma filial cadastrada.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bottleneck Cards */}
        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-3">
          <CardHeader>
            <CardTitle>Gargalos Operacionais</CardTitle>
            <CardDescription>Pontos de atenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">              <Warning
                className="size-4 text-warning"
                weight="fill"
              />
                <span className="text-sm font-medium">
                  Leads não trabalhados
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.totals.unworked}
              </p>
              <p className="text-xs text-muted-foreground">
                Distribuídos há mais de 15 minutos sem contato
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Warning
                  className="size-4 text-destructive"
                  weight="fill"
                />
                <span className="text-sm font-medium">
                  Leads estagnados
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.totals.stalled}
              </p>
              <p className="text-xs text-muted-foreground">
                Sem avanço há mais de 3 dias
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <UserList
                  className="size-4 text-chart-2"
                  weight="fill"
                />
                <span className="text-sm font-medium">Equipe</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.totals.activeBrokers}/{data.totals.members}
              </p>
              <p className="text-xs text-muted-foreground">
                Corretores ativos vs. cadastrados
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />

      {/* Bottom Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Leads totais', value: totalLeads, color: 'text-chart-1' },
          { label: 'Conversões', value: totalConverted, color: 'text-chart-5' },
          { label: 'Taxa de conversão', value: `${conversionRate}%`, color: 'text-chart-2' },
          { label: 'Corretores ativos', value: `${data.totals.activeBrokers}/${data.totals.members}`, color: 'text-chart-4' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.2) }}
            className="rounded-lg border border-border/40 bg-card p-3 text-center shadow-none"
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ─── Manager Dashboard ──────────────────────────────────────────────────────

function ManagerNocContent({ data }: { data: ManagerDashboardData }) {
  const teamPercent =
    data.teamSize > 0
      ? Math.round((data.activeMembers / data.teamSize) * 100)
      : 0;
  const newPercent =
    data.leadsTotal > 0
      ? Math.round((data.newLeads / data.leadsTotal) * 100)
      : 0;
  const contactPercent =
    data.leadsTotal > 0
      ? Math.round((data.inContact / data.leadsTotal) * 100)
      : 0;

  const activities = [
    {
      id: 1,
      type: "new_lead",
      message: `${data.newLeads} leads novos aguardando contato`,
      time: "hoje",
      user: "Sistema",
    },
    {
      id: 2,
      type: "alert",
      message: `${data.unworked} leads não trabalhados (+15min sem contato)`,
      time: "agora",
      user: "Alerta",
    },
    {
      id: 3,
      type: "alert",
      message: `${data.stalled} leads estagnados sem avanço há +3 dias`,
      time: "agora",
      user: "Alerta",
    },
    {
      id: 4,
      type: "conversion",
      message: `${data.teamSize - data.activeMembers
        } corretores offline na filial`,
      time: "hoje",
      user: "Sistema",
    },
  ];

  return (
    <>
      {/* Status Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
            <SealCheck className="size-5 text-success" weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {data.branchName} — Operacional
            </h2>
            <p className="text-xs text-muted-foreground">
              {data.activeMembers} de {data.teamSize}{" "}
              {data.teamSize === 1 ? "corretor ativo" : "corretores ativos"}{" "}
              · {data.leadsTotal} leads na filial
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md text-xs font-normal"
          >
            <StatusIndicator
              status={data.newLeads === 0 ? "operational" : "degraded"}
            />
            {data.newLeads} novos
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md text-xs font-normal"
          >
            <StatusIndicator
              status={data.unworked > 5 ? "degraded" : "operational"}
            />
            {data.unworked} não trab.
          </Badge>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <NocMetricCard
          label="Corretores Ativos"
          value={data.activeMembers}
          change={`${teamPercent}%`}
          description={`${data.teamSize} membros cadastrados`}
          delay={0}
        />
        <NocMetricCard
          label="Leads Novos"
          value={data.newLeads}
          change={`${newPercent}% do total`}
          description={`${data.unassigned} sem responsável`}
          delay={80}
        />
        <NocMetricCard
          label="Em Atendimento"
          value={data.inContact}
          change={`${contactPercent}%`}
          description={`de ${data.leadsTotal} leads totais`}
          delay={160}
        />
        <NocMetricCard
          label="Não Trabalhados"
          value={data.unworked}
          change={data.unworked > 0 ? "urgente" : "ok"}
          description="Distribuídos há +15min"
          delay={240}
        />
        <NocMetricCard
          label="Estagnados"
          value={data.stalled}
          change={data.stalled > 0 ? "atenção" : "ok"}
          description="Sem avanço há +3 dias"
          delay={320}
        />
      </section>

      {/* Team Overview + Bottlenecks */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral da Equipe</CardTitle>
            <CardDescription>
              Capacidade operacional da filial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">
                  Corretores Ativos
                </span>
                <span className="text-muted-foreground">
                  {data.activeMembers}/{data.teamSize}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-5 transition-all duration-700"
                  style={{ width: `${teamPercent}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">Leads Novos</span>
                <span className="text-muted-foreground">
                  {data.newLeads}/{data.leadsTotal}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-3 transition-all duration-700"
                  style={{ width: `${newPercent}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">
                  Em Atendimento
                </span>
                <span className="text-muted-foreground">
                  {data.inContact}/{data.leadsTotal}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-4 transition-all duration-700"
                  style={{ width: `${contactPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-3">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Pontos que precisam de ação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">              <Warning
                className="size-4 text-warning"
                weight="fill"
              />
                <span className="text-sm font-medium">
                  Não trabalhados
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.unworked}
              </p>
              <p className="text-xs text-muted-foreground">
                Leads distribuídos sem contato inicial
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Warning
                  className="size-4 text-destructive"
                  weight="fill"
                />
                <span className="text-sm font-medium">
                  Estagnados
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.stalled}
              </p>
              <p className="text-xs text-muted-foreground">
                Sem avanço há mais de 3 dias
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-chart-2" weight="fill" />
                <span className="text-sm font-medium">
                  Sem responsável
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.unassigned}
              </p>
              <p className="text-xs text-muted-foreground">
                Leads não atribuídos a nenhum corretor
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Leads totais', value: data.leadsTotal, color: 'text-chart-1' },
          { label: 'Leads novos', value: data.newLeads, color: 'text-chart-3' },
          { label: 'Corretores ativos', value: data.activeMembers, color: 'text-chart-5' },
          { label: 'Em atendimento', value: data.inContact, color: 'text-chart-4' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.2) }}
            className="rounded-lg border border-border/40 bg-card p-3 text-center shadow-none"
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ─── Broker Dashboard ────────────────────────────────────────────────────────

function BrokerNocContent({ data }: { data: BrokerDashboardData }) {
  const activePercent =
    data.totals.all > 0
      ? Math.round((data.totals.active / data.totals.all) * 100)
      : 0;
  const convPercent =
    data.totals.all > 0
      ? Math.round((data.totals.converted / data.totals.all) * 100)
      : 0;

  const distributionData = [
    {
      name: "Novos",
      value: data.totals.new,
      color: "var(--chart-1)",
    },
    {
      name: "Contato",
      value: data.totals.inContact,
      color: "var(--chart-3)",
    },
    {
      name: "Ativos",
      value: Math.max(
        0,
        data.totals.active - data.totals.new - data.totals.inContact
      ),
      color: "var(--chart-4)",
    },
    {
      name: "Convertidos",
      value: data.totals.converted,
      color: "var(--chart-5)",
    },
  ].filter((d) => d.value > 0);

  const activities: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
    user: string;
  }> =
    data.activeLeads.length > 0
      ? data.activeLeads.slice(0, 8).map((lead, i) => ({
        id: i + 1,
        type: "new_lead",
        message: `Atendimento ativo — ${lead.name} (${lead.status})`,
        time: "hoje",
        user: lead.serviceStartedAt
          ? new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(lead.serviceStartedAt)
          : "Sistema",
      }))
      : [
        {
          id: 99,
          type: "conversion",
          message: "Nenhum atendimento ativo no momento",
          time: "agora",
          user: "Sistema",
        },
      ];

  return (
    <>
      {/* Status Header */}
      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-chart-2/10">
            <Users className="size-5 text-chart-2" weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              Minha Carteira · {data.branchName}
            </h2>
            <p className="text-xs text-muted-foreground">
              {data.totals.all} leads · {data.totals.active} ativos ·{" "}
              {data.totals.converted} convertidos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md text-xs font-normal"
          >
            <Globe className="size-3.5 text-chart-3" weight="fill" />
            {data.availabilityStatus === "available"
              ? "Disponível"
              : "Pausado"}
          </Badge>
        </div>
      </section>

      {/* Quick-action cards for pending items */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/leads?status=distributed"
          className="group rounded-xl border border-warning/30 bg-accent/[0.04] p-4 outline-none transition-colors hover:border-warning/50 hover:bg-accent/[0.07] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
              <Warning className="size-4 text-warning" weight="fill" />
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-sm font-medium">Pendentes</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totals.distributed}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className={`size-1.5 rounded-full ${data.pendingStaleness.overdueCount > 0 ? "bg-destructive" : "bg-muted-foreground/40"}`} />
              {data.pendingStaleness.overdueCount} {data.pendingStaleness.overdueCount === 1 ? "venceu" : "venceram"} o SLA
            </span>
            {data.pendingStaleness.oldestMinutes !== null && (
              <>
                <span>·</span>
                <span>mais antigo: {data.pendingStaleness.oldestMinutes} min</span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-4 text-muted-foreground/70">Leads atribuídos aguardando primeiro contato</p>
        </Link>

        <Link
          href="/leads?status=lost"
          className="group rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4 outline-none transition-colors hover:border-destructive/40 hover:bg-destructive/[0.06] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
              <XCircle className="size-4 text-destructive" weight="fill" />
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-sm font-medium">Perdidos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totals.lost}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Leads perdidos — podem ser reativados</p>
        </Link>

        <Link
          href="/leads"
          className="group rounded-xl border border-border/60 bg-muted/20 p-4 outline-none transition-colors hover:border-primary/30 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10">
              <UserList className="size-4 text-chart-3" weight="fill" />
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-sm font-medium">Precisa de ação</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.totals.active}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Leads em atendimento que precisam de retorno</p>
        </Link>
      </section>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <NocMetricCard
          label="Leads na Carteira"
          value={data.totals.all}
          change={`${data.totals.active} ativos`}
          description="Total de leads atribuídos"
          delay={0}
        />
        <NocMetricCard
          label="Ativos"
          value={data.totals.active}
          change={`${activePercent}%`}
          description="Leads em atendimento"
          delay={80}
        />
        <NocMetricCard
          label="Pendentes"
          value={data.totals.distributed}
          change="sem primeiro contato"
          description="Aguardando contato inicial"
          delay={160}
        />
        <NocMetricCard
          label="Em Contato"
          value={data.totals.inContact}
          change="status atual"
          description="Atendimentos em andamento"
          delay={240}
        />
        <NocMetricCard
          label="Convertidos"
          value={data.totals.converted}
          change={`${convPercent}%`}
          description="Leads fechados"
          delay={320}
        />
      </section>

      {/* Active Leads + Chart */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-4">
          <CardHeader>
            <CardTitle>Distribuição da Carteira</CardTitle>
            <CardDescription>
              Status atual dos seus leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center">
              <div className="relative">
                <ResponsiveContainer height={180} width={220}>
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={distributionData}
                      dataKey="value"
                      endAngle={-270}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      strokeWidth={0}
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      {distributionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipWrapper />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold tabular-nums">
                    {data.totals.all}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Total
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {distributionData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/70 bg-card shadow-none lg:col-span-3">
          <CardHeader>
            <CardTitle>Atendimentos Ativos</CardTitle>
            <CardDescription>
              Leads que você está atendendo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">              {data.activeLeads.length > 0 ? (
            data.activeLeads.slice(0, 5).map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.2) }}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-chart-3/10">
                  <Users
                    className="size-4 text-chart-3"
                    weight="fill"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {lead.status.replace(/_/g, " ")}
                  </p>
                </div>
                {lead.serviceStartedAt && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Intl.DateTimeFormat("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(lead.serviceStartedAt)}
                  </span>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum atendimento ativo no momento.
            </div>
          )}
            {data.activeLeads.length > 5 && (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                +{data.activeLeads.length - 5} atendimentos
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Leads totais', value: data.totals.all, color: 'text-chart-1' },
          { label: 'Leads novos', value: data.totals.new, color: 'text-chart-3' },
          { label: 'Convertidos', value: data.totals.converted, color: 'text-chart-5' },
          { label: 'Em atendimento', value: data.activeLeads.length, color: 'text-chart-4' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.2) }}
            className="rounded-lg border border-border/40 bg-card p-3 text-center shadow-none"
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NocDashboardContent(props: RoleProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime?.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime?.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title =
    props.role === "director"
      ? "Dashboard Executivo"
      : props.role === "manager"
        ? "Dashboard da Filial"
        : "Meu Dashboard";

  return (
    <>
      <DashboardHeader
        breadcrumb="Dashboard"
        title={title}
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs tabular-nums sm:flex min-w-[280px] justify-center">
              <WifiHigh className="size-3.5 text-success" weight="fill" />
              {mounted && currentTime ? (
                <>
                  <span className="text-muted-foreground">
                    {formattedDate}
                  </span>
                  <span className="font-medium text-foreground">
                    {formattedTime}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground animate-pulse">Sincronizando relógio...</span>
              )}
            </div>
            <Badge className="gap-1.5 rounded-md text-xs" variant="success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/40 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Dados reais
            </Badge>
          </div>
        }
      />

      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        {props.role === "director" && (
          <DirectorNocContent data={props.data} />
        )}
        {props.role === "manager" && (
          <ManagerNocContent data={props.data} />
        )}
        {props.role === "broker" && (
          <BrokerNocContent data={props.data} />
        )}
      </main>


    </>
  );
}
