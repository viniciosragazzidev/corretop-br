"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ChartBar,
  CheckCircle,
  Circle,
  Database,
  FileText,
  Lightning,
  Phone,
  Plug,
  SealCheck,
  Users,
  Warning,
  WifiHigh,
  XCircle,
} from "@/components/huge-icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const metrics = [
  { label: "Leads Hoje", value: 47, change: "+12%", trend: "up" as const, description: "vs. ontem (42)" },
  { label: "Atendimentos Ativos", value: 23, change: "+5%", trend: "up" as const, description: "13 conversas, 10 negociações" },
  { label: "Taxa de Conversão", value: "68%", change: "+3pp", trend: "up" as const, description: "Média do mês: 64%" },
  { label: "Tempo Médio", value: "4m12s", change: "-18s", trend: "up" as const, description: "Primeiro contato com lead" },
  { label: "Ticket Médio", value: "R$ 297", change: "+8%", trend: "up" as const, description: "Plano mais contratado: Bronze" },
];

const leadFlowData = [
  { dia: "Seg", leads: 32, contatos: 24, conversoes: 8 },
  { dia: "Ter", leads: 38, contatos: 29, conversoes: 11 },
  { dia: "Qua", leads: 45, contatos: 34, conversoes: 14 },
  { dia: "Qui", leads: 41, contatos: 31, conversoes: 12 },
  { dia: "Sex", leads: 52, contatos: 40, conversoes: 18 },
  { dia: "Sáb", leads: 28, contatos: 20, conversoes: 6 },
  { dia: "Dom", leads: 19, contatos: 14, conversoes: 4 },
];

const statusDistribution = [
  { name: "Novos", value: 18, color: "var(--chart-1)" },
  { name: "Em Contato", value: 25, color: "var(--chart-2)" },
  { name: "Cotação", value: 15, color: "var(--chart-3)" },
  { name: "Negociação", value: 10, color: "var(--chart-4)" },
  { name: "Convertidos", value: 8, color: "var(--chart-5)" },
];

const hourlyActivity = [
  { hora: "06h", leads: 2, contatos: 1 },
  { hora: "08h", leads: 8, contatos: 5 },
  { hora: "10h", leads: 14, contatos: 10 },
  { hora: "12h", leads: 6, contatos: 4 },
  { hora: "14h", leads: 12, contatos: 9 },
  { hora: "16h", leads: 10, contatos: 7 },
  { hora: "18h", leads: 4, contatos: 3 },
  { hora: "20h", leads: 1, contatos: 0 },
];

const services = [
  { name: "API Principal", status: "operational" as const, uptime: "99.97%", latency: "45ms", icon: Plug },
  { name: "Banco de Dados", status: "operational" as const, uptime: "99.99%", latency: "12ms", icon: Database },
  { name: "Webhook", status: "operational" as const, uptime: "99.88%", latency: "120ms", icon: WifiHigh },
  { name: "WhatsApp", status: "operational" as const, uptime: "99.95%", latency: "230ms", icon: Phone },
  { name: "E-mail", status: "degraded" as const, uptime: "96.2%", latency: "1.4s", icon: FileText },
  { name: "CDN", status: "operational" as const, uptime: "100%", latency: "28ms", icon: Lightning },
];

const recentActivities = [
  { id: 1, type: "conversion", message: "Lead #3421 convertido — Plano Ouro", time: "há 2 min", user: "Carlos M." },
  { id: 2, type: "new_lead", message: "Novo lead distribuído para Maria F.", time: "há 5 min", user: "Sistema" },
  { id: 3, type: "quote", message: "Cotação enviada para Lead #3389", time: "há 12 min", user: "Ana R." },
  { id: 4, type: "status_change", message: "Lead #3402 movido para Negociação", time: "há 18 min", user: "Pedro S." },
  { id: 5, type: "alert", message: "Tempo de resposta excedido — Lead #3415", time: "há 25 min", user: "Alerta" },
  { id: 6, type: "conversion", message: "Lead #3394 convertido — Plano Prata", time: "há 38 min", user: "Luiza C." },
  { id: 7, type: "new_lead", message: "3 novos leads via Webhook", time: "há 45 min", user: "Sistema" },
  { id: 8, type: "quote", message: "Cotação revisada para Lead #3367", time: "há 1h", user: "Carlos M." },
];

const teamPerformance = [
  { nome: "Carlos M.", leads: 12, conversoes: 5, taxa: 42 },
  { nome: "Ana R.", leads: 10, conversoes: 4, taxa: 40 },
  { nome: "Pedro S.", leads: 8, conversoes: 3, taxa: 38 },
  { nome: "Luiza C.", leads: 9, conversoes: 4, taxa: 44 },
  { nome: "Maria F.", leads: 6, conversoes: 1, taxa: 17 },
];

// ─── Helper Components ───────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: "operational" | "degraded" | "down" }) {
  if (status === "operational") return <SealCheck className="size-4 text-success" weight="fill" />;
  if (status === "degraded") return <Warning className="size-4 text-warning" weight="fill" />;
  return <XCircle className="size-4 text-destructive" weight="fill" />;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "conversion": return <CheckCircle className="size-3.5 text-success" weight="fill" />;
    case "new_lead": return <Users className="size-3.5 text-chart-3" weight="fill" />;
    case "quote": return <FileText className="size-3.5 text-chart-2" weight="fill" />;
    case "alert": return <Warning className="size-3.5 text-warning" weight="fill" />;
    default: return <Circle className="size-3.5 text-muted-foreground" weight="fill" />;
  }
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function NocMetricCard({
  label,
  value,
  change,
  trend,
  description,
  delay,
}: {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="h-full"
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] } },
      }}
      initial="hidden"
      animate="visible"
      transition={{ delay: delay / 1000 }}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } }}
      whileTap={{ scale: 0.995, transition: { duration: 0.1 } }}
    >
      <Card className="group/card h-full min-w-0 rounded-xl border-border/70 bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm hover:shadow-primary/5">
        <CardHeader className="min-w-0 pb-2">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 text-sm leading-5 text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{label}</span>
            <Badge
              className="shrink-0 rounded-md text-xs font-medium transition-transform duration-200 group-hover/card:scale-105"
              variant={trend === "up" ? "success" : "destructive"}
            >
              <ArrowUpRight className="mr-0.5 size-3 transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" weight="bold" />
              {change}
            </Badge>
          </div>
        </CardHeader>
      <CardContent className="min-w-0">
        <p className="whitespace-nowrap text-2xl font-semibold tracking-tight tabular-nums transition-colors duration-200 group-hover/card:text-primary lg:text-3xl">{value}</p>
        <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground/70">{description}</p>
      </CardContent>
    </Card>
    </motion.div>
  );
}

// ─── Custom Tooltips ─────────────────────────────────────────────────────────

function ChartTooltipWrapper({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NocPage() {  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
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

  const totalLeadsToday = leadFlowData.reduce((acc, d) => acc + d.leads, 0);
  const totalConversionsToday = leadFlowData.reduce((acc, d) => acc + d.conversoes, 0);

  return (
    <>
      <DashboardHeader
        breadcrumb="Operações"
        title="NOC — Centro de Operações"
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs tabular-nums sm:flex">
              <WifiHigh className="size-3.5 text-success" weight="fill" />
              <span className="text-muted-foreground">{formattedDate ?? "Carregando..."}</span>
              <span className="font-medium text-foreground">{formattedTime ?? "--:--:--"}</span>
            </div>
            <Badge className="gap-1.5 rounded-md text-xs" variant="success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/40 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Ao vivo
            </Badge>
          </div>
        }
      />

      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        {/* Status Header */}
        <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <SealCheck className="size-5 text-success" weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Todos os sistemas operacionais</h2>
              <p className="text-xs text-muted-foreground">
                {services.filter((s) => s.status === "operational").length} de {services.length} serviços online
                — Uptime médio: 99.3%
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 4).map((s) => (
              <Badge key={s.name} variant="outline" className="gap-1.5 rounded-md text-xs font-normal">
                <StatusIndicator status={s.status} />
                {s.name}
              </Badge>
            ))}
            <Badge variant="outline" className="gap-1 rounded-md text-xs font-normal">
              +{services.length - 4}
            </Badge>
          </div>
        </section>

        {/* Metric Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {metrics.map((metric, i) => (
            <NocMetricCard key={metric.label} {...metric} delay={i * 80} />
          ))}
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Lead Flow Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
          >
          <Card className="min-w-0 rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fluxo de Leads</CardTitle>
                  <CardDescription>Últimos 7 dias — leads, contatos e conversões</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-[var(--chart-1)]" />
                    Leads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-[var(--chart-3)]" />
                    Contatos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-[var(--chart-5)]" />
                    Conversões
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={leadFlowData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="leadsGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="contatosGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="conversoesGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="dia" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} />
                    <YAxis axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} />
                    <Tooltip content={<ChartTooltipWrapper />} cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />
                    <Area dataKey="leads" fill="url(#leadsGradient)" stroke="var(--chart-1)" strokeWidth={2} type="monotone" animationDuration={500} animationEasing="ease-out" />
                    <Area dataKey="contatos" fill="url(#contatosGradient)" stroke="var(--chart-3)" strokeWidth={2} type="monotone" animationDuration={500} animationEasing="ease-out" animationBegin={100} />
                    <Area dataKey="conversoes" fill="url(#conversoesGradient)" stroke="var(--chart-5)" strokeWidth={2} type="monotone" animationDuration={500} animationEasing="ease-out" animationBegin={200} />
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
          >
          <Card className="min-w-0 rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Distribuição atual dos leads em cada etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={statusDistribution}
                      dataKey="value"
                      endAngle={-270}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipWrapper />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold tabular-nums">
                    {statusDistribution.reduce((a, b) => a + b.value, 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">Total de Leads</span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="ml-auto font-medium tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </section>

        {/* Second Row: Hourly Activity + Team Performance + System Status */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Hourly Activity Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
          >
          <Card className="min-w-0 rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Atividade Hoje</CardTitle>
              <CardDescription>Leads recebidos e contatos realizados por hora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={hourlyActivity} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="hora" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} />
                    <YAxis axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} />
                    <Tooltip content={<ChartTooltipWrapper />} cursor={{ fill: "var(--muted)" }} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                      iconSize={8}
                    />
                    <Bar barSize={16} dataKey="leads" fill="var(--chart-1)" radius={[3, 3, 0, 0]} animationDuration={400} animationEasing="ease-out" />
                    <Bar barSize={16} dataKey="contatos" fill="var(--chart-3)" radius={[3, 3, 0, 0]} animationDuration={400} animationEasing="ease-out" animationBegin={100} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Team Performance */}
          <Card className="min-w-0 rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Desempenho da Equipe</CardTitle>
              <CardDescription>Corretores — leads e conversões hoje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamPerformance.map((member, i) => (
                <motion.div
                  key={member.nome}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.25) }}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{member.nome}</span>
                    <span className="text-muted-foreground">
                      {member.conversoes}/{member.leads} · {member.taxa}%
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-smooth-out"
                      style={{
                        width: `${member.taxa}%`,
                        backgroundColor:
                          member.taxa >= 40
                            ? "var(--chart-5)"
                            : member.taxa >= 30
                              ? "var(--chart-3)"
                              : "var(--muted-foreground)",
                      }}
                    />
                  </div>
                </motion.div>
                ))}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="min-w-0 rounded-xl border-border/70 bg-card shadow-none">
            <CardHeader>
              <CardTitle>Status dos Serviços</CardTitle>
              <CardDescription>Saúde atual da infraestrutura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.06, 0.3) }}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        service.status === "operational"
                          ? "bg-success/10"
                          : service.status === "degraded"
                            ? "bg-warning/10"
                            : "bg-destructive/10",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          service.status === "operational"
                            ? "text-success"
                            : service.status === "degraded"
                              ? "text-warning"
                              : "text-destructive",
                        )}
                        weight="fill"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{service.name}</span>
                        <StatusIndicator status={service.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Uptime: {service.uptime}</span>
                        <span>·</span>
                        <span>{service.latency}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity Feed */}
        <Card className="rounded-xl border-border/70 bg-card shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Movimentações em tempo real da operação</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1.5 rounded-md text-xs">
                <ChartBar className="size-3" weight="fill" />
                Tempo real
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72">
              <div className="space-y-0">
                {recentActivities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-start gap-4 border-b border-border/40 px-6 py-3.5 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-muted/60">
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.user}</span>
                        <span>·</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Leads na semana', value: totalLeadsToday, color: 'text-chart-1' },
            { label: 'Conversões na semana', value: totalConversionsToday, color: 'text-chart-5' },
            { label: 'Taxa de conversão semanal', value: `${Math.round((totalConversionsToday / totalLeadsToday) * 100)}%`, color: 'text-chart-2' },
            { label: 'Serviços operacionais', value: `${services.filter((s) => s.status === "operational").length}/${services.length}`, color: 'text-chart-4' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0, 0, 0.2, 1], delay: Math.min(i * 0.05, 0.2) }}
              className="rounded-lg border border-border/40 bg-card p-3 text-center shadow-none"
            >
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </main>

    </>
  );
}
