"use client";

import { useActionState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Buildings,
  CheckCircle,
  Users,
  WifiHigh,
  XCircle,
  TrendUp,
  Power,
  Pause,
} from "@/components/huge-icons";
import { toast } from "sonner";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  toggleAcceptingLeadsAction,
  toggleAutoDistributeAction,
  toggleBrokerAvailabilityAction,
  type BranchActionState,
} from "@/features/branches/actions";

type BranchItem = {
  id: string;
  name: string;
  status: "active" | "inactive";
  acceptingLeads: boolean;
  autoDistribute: boolean;
  memberCount: number;
  availableBrokers: number;
  activeLeads: number;
  newLeads: number;
};

type Metrics = {
  totalBranches: number;
  acceptingBranches: number;
  autoDistributeBranches: number;
  totalBrokers: number;
  totalAvailable: number;
  totalNewLeads: number;
};

type BrokerItem = {
  id: string;
  name: string;
  email: string;
  availabilityStatus: "available" | "paused";
  activeLeads: number;
};

function ActionFeedback({ state }: { state: BranchActionState }) {
  useEffect(() => {
    if (state.success) toast.success("Configuração atualizada.");
    if (state.error) toast.error(state.error);
  }, [state.success, state.error]);
  return null;
}

function ToggleCell({
  branchId,
  label,
  enabled,
  action,
}: {
  branchId: string;
  label: string;
  enabled: boolean;
  action: (prev: BranchActionState, formData: FormData) => Promise<BranchActionState>;
}) {
  const [state, formAction, pending] = useActionState<BranchActionState, FormData>(action, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="branchId" value={branchId} />
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
          enabled
            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        } disabled:opacity-50`}
        title={`Clique para ${enabled ? "desativar" : "ativar"} ${label}`}
      >
        {enabled ? <CheckCircle className="size-3.5" /> : <XCircle className="size-3.5" />}
        {enabled ? "Ativo" : "Inativo"}
      </button>
      <ActionFeedback state={state} />
    </form>
  );
}

function BrokerAvailabilityToggle({ broker }: { broker: BrokerItem }) {
  const [state, formAction, pending] = useActionState<BranchActionState, FormData>(toggleBrokerAvailabilityAction, {});
  const available = broker.availabilityStatus === "available";
  return <form action={formAction}><input name="brokerId" type="hidden" value={broker.id} /><Button disabled={pending} size="sm" type="submit" variant={available ? "outline" : "secondary"}>{available ? <Pause /> : <CheckCircle />}{available ? "Bloquear novos leads" : "Liberar recebimento"}</Button><ActionFeedback state={state} /></form>;
}

export function DistributionDashboard({
  branches,
  metrics,
  canManageAcceptingLeads,
  brokers,
}: {
  branches: BranchItem[];
  metrics: Metrics;
  canManageAcceptingLeads: boolean;
  brokers: BrokerItem[];
}) {
  const acceptingRate = metrics.totalBranches > 0
    ? Math.round((metrics.acceptingBranches / metrics.totalBranches) * 100)
    : 0;
  const autoRate = metrics.totalBranches > 0
    ? Math.round((metrics.autoDistributeBranches / metrics.totalBranches) * 100)
    : 0;

  return (
    <>
      {/* Metrics Banner */}
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
        }}
      >
        {[
          {
            label: "Filiais",
            value: metrics.totalBranches,
            sub: `${metrics.acceptingBranches} aceitando leads`,
            icon: Buildings,
            color: "text-chart-1",
          },
          {
            label: "Recebendo leads",
            value: `${metrics.acceptingBranches}/${metrics.totalBranches}`,
            sub: `${acceptingRate}% das filiais`,
            icon: WifiHigh,
            color: acceptingRate > 50 ? "text-emerald-400" : "text-amber-400",
          },
          {
            label: "Distribuição automática",
            value: `${metrics.autoDistributeBranches}/${metrics.totalBranches}`,
            sub: `${autoRate}% das filiais`,
            icon: TrendUp,
            color: autoRate > 50 ? "text-emerald-400" : "text-amber-400",
          },
          {
            label: "Corretores disponíveis",
            value: metrics.totalAvailable,
            sub: `${metrics.totalBrokers} corretores vinculados`,
            icon: Users,
            color: "text-chart-2",
          },
          {
            label: "Leads novos",
            value: metrics.totalNewLeads,
            sub: "Aguardando primeiro contato",
            icon: Power,
            color: metrics.totalNewLeads > 0 ? "text-amber-400" : "text-muted-foreground",
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] } },
              }}
              whileHover={{ y: -2, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } }}
              whileTap={{ scale: 0.995, transition: { duration: 0.1 } }}
            >
              <Card className="group/card border-border bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm hover:shadow-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{metric.label}</p>
                    <Icon className={`size-4 shrink-0 ${metric.color}`} />
                  </div>
                  <p className="mt-2 font-mono text-2xl font-semibold transition-colors duration-200 group-hover/card:text-primary">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Branch Table */}
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Filiais</CardTitle>
            <CardDescription>
              Controle individual de recebimento e distribuição automática por unidade.
            </CardDescription>
          </div>
          <Button render={<Link href="/filiais" />} size="sm" variant="outline">
            <Buildings />
            Gerenciar filiais
          </Button>
          <Button render={<Link href="/leads/distribuicao/plantao" />} size="sm" variant="outline">
            Plantões
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {branches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Buildings className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma filial cadastrada</p>
              <p className="text-xs text-muted-foreground">Crie a primeira unidade para configurar a distribuição.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5 min-w-[180px]">Filial</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Receber leads</TableHead>
                    <TableHead className="min-w-[140px]">Distrib. automática</TableHead>
                    <TableHead className="min-w-[100px]">Corretores</TableHead>
                    <TableHead className="min-w-[80px]">Disponíveis</TableHead>
                    <TableHead className="min-w-[80px]">Leads ativos</TableHead>
                    <TableHead className="pr-5 min-w-[80px]">Novos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch, i) => (
                    <motion.tr
                      key={branch.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.15,
                        ease: [0, 0, 0.2, 1],
                        delay: Math.min(i * 0.03, 0.25),
                      }}
                    >
                      <TableCell className="pl-5">
                        <p className="font-medium">{branch.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            branch.status === "active"
                              ? "border-emerald-500/40 text-emerald-500"
                              : "text-muted-foreground"
                          }
                        >
                          {branch.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canManageAcceptingLeads ? <ToggleCell
                          branchId={branch.id}
                          label="recebimento de leads"
                          enabled={branch.acceptingLeads}
                          action={toggleAcceptingLeadsAction}
                        /> : <Badge variant="outline">{branch.acceptingLeads ? "Ativa" : "Inativa"}</Badge>}
                      </TableCell>
                      <TableCell>
                        <ToggleCell
                          branchId={branch.id}
                          label="distribuição automática"
                          enabled={branch.autoDistribute}
                          action={toggleAutoDistributeAction}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm tabular-nums">{branch.memberCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm tabular-nums ${branch.availableBrokers > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {branch.availableBrokers}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm tabular-nums">{branch.activeLeads}</span>
                      </TableCell>
                      <TableCell className="pr-5">
                        <span className={`font-mono text-sm tabular-nums ${branch.newLeads > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                          {branch.newLeads}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle>Corretores da unidade</CardTitle>
          <CardDescription>Pause o recebimento de novos leads sem remover o corretor da equipe. Leads já atribuídos continuam na carteira dele.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.length ? brokers.map((broker) => <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3" key={broker.id}><div className="min-w-0"><p className="truncate text-sm font-medium">{broker.name}</p><p className="truncate text-xs text-muted-foreground">{broker.email}</p><p className="mt-1 text-xs text-muted-foreground">{broker.activeLeads} lead{broker.activeLeads === 1 ? "" : "s"} ativo{broker.activeLeads === 1 ? "" : "s"}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><Badge variant={broker.availabilityStatus === "available" ? "outline" : "secondary"}>{broker.availabilityStatus === "available" ? "Recebendo" : "Pausado"}</Badge><BrokerAvailabilityToggle broker={broker} /></div></div>) : <p className="text-sm text-muted-foreground">Nenhum corretor ativo nesta unidade.</p>}
        </CardContent>
      </Card>

      {/* Summary / Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-emerald-400" />
          <span>Recebendo leads ativo — leads de webhooks/manuais são roteados para esta filial</span>
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="size-3.5 text-emerald-400" />
          <span>Distrib. automática — leads são atribuídos automaticamente a corretores disponíveis</span>
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="size-3.5 text-muted-foreground" />
          <span>Inativo — a filial não participa desta funcionalidade</span>
        </span>
      </div>
    </>
  );
}
