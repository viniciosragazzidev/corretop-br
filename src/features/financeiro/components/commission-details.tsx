"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowsDownUp,
  Calculator,
  MagnifyingGlass,
  TrendUp,
} from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CommissionDetailsData } from "@/features/financeiro/queries/commission-details";

type Props = {
  data: CommissionDetailsData;
  role?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatCurrencyCompact(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "R$ 0";
  if (num >= 1_000_000) return `R$ ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `R$ ${(num / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(date),
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

// StatCard do @/components/dashboard/metric-card é usado abaixo

// ─── Status Badge ─────────────────────────────────────────────────────────

function ScheduleStatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <Badge
        variant="success"
        className="border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
      >
        Pago
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge
        variant="warning"
        className="border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
      >
        Pendente
      </Badge>
    );
  return <Badge variant="outline">Cancelado</Badge>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CommissionDetails({ data }: Props) {
  const { summary, byBroker, bySale } = data;

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"brokers" | "sales">("sales");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "pending" | "paid">("all");

  const normalizedQuery = normalize(search.trim());

  // Filter sales
  const visibleSales = useMemo(() => {
    return bySale.filter((sale) => {
      const matchesSearch =
        !normalizedQuery ||
        normalize(sale.leadName).includes(normalizedQuery) ||
        normalize(sale.brokerName ?? "").includes(normalizedQuery) ||
        normalize(sale.planName ?? "").includes(normalizedQuery) ||
        normalize(sale.carrierName ?? "").includes(normalizedQuery) ||
        normalize(sale.ruleName ?? "").includes(normalizedQuery);
      const hasMatchingSchedule =
        scheduleFilter === "all" ||
        sale.scheduleItems.some((item) => item.status === scheduleFilter);
      return matchesSearch && hasMatchingSchedule;
    });
  }, [bySale, normalizedQuery, scheduleFilter]);

  // Filter brokers
  const visibleBrokers = useMemo(() => {
    return byBroker.filter((broker) => {
      return (
        !normalizedQuery ||
        normalize(broker.brokerName ?? "").includes(normalizedQuery)
      );
    });
  }, [byBroker, normalizedQuery]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}>
          <StatCard label="Total de comissões" value={formatCurrencyCompact(summary.totalCommission)} icon={TrendUp} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}>
          <StatCard label="Comissões pendentes" value={formatCurrencyCompact(summary.pendingCommission)} icon={ArrowsDownUp} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}>
          <StatCard label="Comissões pagas" value={formatCurrencyCompact(summary.paidCommission)} icon={Calculator} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}>
          <StatCard label="Vendas / Regras ativas" value={`${summary.totalSales} / ${summary.activeRules}`} icon={Calculator} />
        </motion.div>
      </section>

      {/* Tabs: Brokers / Sales */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          onClick={() => setView("sales")}
          className={`pb-3 text-sm font-medium transition-colors ${view === "sales"
            ? "border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Por venda
        </button>
        <button
          onClick={() => setView("brokers")}
          className={`pb-3 text-sm font-medium transition-colors ${view === "brokers"
            ? "border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Por corretor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            placeholder={
              view === "sales"
                ? "Buscar por lead, corretor, plano..."
                : "Buscar por corretor..."
            }
            aria-label="Buscar"
          />
        </div>
        {view === "sales" && (
          <select
            value={scheduleFilter}
            onChange={(e) =>
              setScheduleFilter(e.target.value as "all" | "pending" | "paid")
            }
            className="h-9 rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Filtrar por status"
          >
            <option value="all">Todas as parcelas</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
          </select>
        )}
      </div>

      {/* Broker Summary Table */}
      {view === "brokers" && (
        <>
          {visibleBrokers.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
              <p className="font-medium">Nenhum corretor encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste a busca para ver outros resultados.
              </p>
            </div>
          ) : (
            <Card className="border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Comissões por Corretor</CardTitle>
                <CardDescription>
                  Resumo de comissões agrupado por corretor
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Corretor</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Valor vendido</TableHead>
                      <TableHead className="text-right">Total comissão</TableHead>
                      <TableHead className="text-right">Pendente</TableHead>
                      <TableHead className="pr-5 text-right">Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleBrokers.map((broker) => (
                      <TableRow key={broker.brokerId}>
                        <TableCell className="pl-5 font-medium">
                          {broker.brokerName ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {broker.branchName ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {broker.totalSales}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {formatCurrency(broker.totalSaleValue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                          {formatCurrency(broker.totalCommission)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums text-amber-600 dark:text-amber-400">
                          {formatCurrency(broker.pendingCommission)}
                        </TableCell>
                        <TableCell className="pr-5 text-right font-mono text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(broker.paidCommission)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sales Detail View */}
      {view === "sales" && (
        <>
          {bySale.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
              <p className="font-medium">Nenhuma venda registrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                As vendas aparecerão aqui quando leads forem convertidos.
              </p>
            </div>
          ) : visibleSales.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <p className="text-sm font-medium">Nenhum resultado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste a busca ou o filtro.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setScheduleFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleSales.map((sale, i) => (
                <motion.div
                  key={sale.saleId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.15,
                    ease: [0, 0, 0.2, 1],
                    delay: Math.min(i * 0.04, 0.3),
                  }}
                >
                  <Card className="border-border bg-card shadow-none transition-all duration-200 hover:border-primary/25">
                    <CardContent className="p-0">
                      {/* Sale Header */}
                      <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/vendas/${sale.saleId}`}
                              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {sale.leadName}
                            </Link>
                            <Badge
                              variant={
                                sale.status === "active" ? "success" : "outline"
                              }
                              className="rounded-md text-xs"
                            >
                              {sale.status === "active" ? "Ativa" : "Cancelada"}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Corretor: <strong>{sale.brokerName ?? "—"}</strong>
                            </span>
                            {sale.branchName && (
                              <span>Filial: <strong>{sale.branchName}</strong></span>
                            )}
                            {sale.carrierName && (
                              <span>
                                Operadora: <strong>{sale.carrierName}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-lg font-semibold tabular-nums">
                            {formatCurrency(sale.saleValue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(sale.saleDate)}
                          </p>
                        </div>
                      </div>

                      {/* Schedule Items */}
                      {sale.scheduleItems.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border/60 bg-muted/20">
                                <th className="px-5 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Parcela
                                </th>
                                <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Mês ref.
                                </th>
                                <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Vencimento
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  %
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Valor
                                </th>
                                <th className="px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Status
                                </th>
                                <th className="pr-5 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Pago em
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {sale.scheduleItems.map((item) => (
                                <tr
                                  key={item.id}
                                  className="transition-colors hover:bg-muted/20"
                                >
                                  <td className="px-5 py-2 tabular-nums">
                                    {item.monthNumber}ª
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {item.referenceMonth}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground tabular-nums">
                                    {item.dueDate
                                      ? formatDate(item.dueDate)
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                    {item.percentage}%
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
                                    {formatCurrency(item.amount)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <ScheduleStatusBadge status={item.status} />
                                  </td>
                                  <td className="pr-5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                                    {item.paidAt
                                      ? `${formatDate(item.paidAt)}${item.paidByName ? ` · ${item.paidByName}` : ""}`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="px-5 py-4 text-center text-xs text-muted-foreground">
                          Nenhuma parcela de comissão gerada para esta venda.
                        </div>
                      )}

                      {/* Sale Footer - totals */}
                      <div className="border-t border-border/60 bg-muted/10 px-5 py-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {sale.ruleName
                              ? `Regra: ${sale.ruleName}`
                              : "Sem regra de comissão"}
                            {sale.planName && ` · Plano: ${sale.planName}`}
                          </span>
                          <Link
                            href={`/vendas/${sale.saleId}`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            Detalhes
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
