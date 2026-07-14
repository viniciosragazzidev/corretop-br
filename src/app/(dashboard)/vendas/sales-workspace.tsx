"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, MagnifyingGlass } from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SaleRow = {
  id: string;
  leadId: string;
  leadName: string;
  clientName: string | null;
  brokerId: string;
  brokerName: string | null;
  branchName: string | null;
  planName: string | null;
  carrierName: string | null;
  saleDate: string;
  saleValue: number;
  status: string;
  createdAt: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

function SaleStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "active" ? "success" : "outline"}
      className={
        status === "active"
          ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          : "text-muted-foreground"
      }
    >
      {status === "active" ? "Ativa" : "Cancelada"}
    </Badge>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function SalesWorkspace({
  sales,
  totalRevenue,
}: {
  sales: SaleRow[];
  totalRevenue: number;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");

  const normalizedQuery = normalize(search.trim());

  const visibleSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        !normalizedQuery ||
        normalize(sale.leadName).includes(normalizedQuery) ||
        normalize(sale.brokerName ?? "").includes(normalizedQuery) ||
        normalize(sale.planName ?? "").includes(normalizedQuery) ||
        normalize(sale.carrierName ?? "").includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        sale.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, normalizedQuery, statusFilter]);

  const activeSales = sales.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div
        className="grid gap-3 sm:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
        }}
      >
        {[
          { label: "Total de vendas", value: sales.length },
          { label: "Vendas ativas", value: activeSales },
          { label: "Receita total", value: formatCurrency(totalRevenue) },
          { label: "Comissão a repassar", value: formatCurrency(totalRevenue) },
        ].map((item) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] } },
            }}
            whileHover={{ y: -2, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } }}
            whileTap={{ scale: 0.995, transition: { duration: 0.1 } }}
          >
            <Card size="sm" className="group/card border-border bg-card shadow-none transition-all duration-200 hover:border-primary/25 hover:shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground">{item.label}</p>
                <p className="mt-2 font-mono text-lg font-semibold transition-colors duration-200 group-hover/card:text-primary">{item.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs">
            <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              placeholder="Buscar por lead, corretor, plano..."
              aria-label="Buscar venda"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "cancelled")}
            className="h-9 rounded-lg border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label="Filtrar por status"
          >
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {sales.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="mt-3 font-medium">Nenhuma venda registrada</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            As vendas aparecerão aqui automaticamente quando um lead for convertido.
          </p>
        </div>
      ) : visibleSales.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <p className="text-sm font-medium">Nenhuma venda encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou o filtro.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        /* Sales Table */
        <Card className="border-border bg-card shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Lead / Cliente</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="pl-5">
                      <p className="font-medium">{sale.leadName}</p>
                      {sale.clientName && (
                        <p className="text-xs text-muted-foreground">{sale.clientName}</p>
                      )}
                    </TableCell>
                    <TableCell>{sale.brokerName ?? "—"}</TableCell>
                    <TableCell>{sale.branchName ?? "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{sale.planName ?? "—"}</span>
                      {sale.carrierName && (
                        <span className="ml-1 text-xs text-muted-foreground">({sale.carrierName})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(sale.saleDate)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(sale.saleValue)}</TableCell>
                    <TableCell>
                      <SaleStatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button size="icon-sm" variant="ghost" render={<Link href={`/vendas/${sale.id}`} />} aria-label="Ver detalhes">
                        <ArrowRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
