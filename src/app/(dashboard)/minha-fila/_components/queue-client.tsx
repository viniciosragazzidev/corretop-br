"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  MagnifyingGlass,
} from "@/components/huge-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Novo", color: "bg-chart-1 text-chart-1" },
  distributed: { label: "Distribuído", color: "bg-chart-2 text-chart-2" },
  in_contact: { label: "Em contato", color: "bg-chart-3 text-chart-3" },
  quote_sent: { label: "Cotação enviada", color: "bg-warning text-warning" },
  negotiation: { label: "Negociação", color: "bg-chart-4 text-chart-4" },
  documentation_pending: {
    label: "Documentação",
    color: "bg-chart-5 text-chart-5",
  },
  under_analysis: { label: "Em análise", color: "bg-muted-foreground text-muted-foreground" },
  converted: { label: "Convertido", color: "bg-success text-success" },
  lost: { label: "Perdido", color: "bg-destructive text-destructive" },
};

const sourceLabels: Record<string, string> = {
  webhook: "Automático",
  manual: "Manual",
};

export function BrokerQueueClient({
  leads,
  userName,
  availabilityStatus,
}: {
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    source: string;
    status: string;
    maskPhone: string;
    createdAt: Date;
    lastInteractionAt: Date | null;
    taskCount: number;
  }>;
  userName: string;
  availabilityStatus: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return leads.filter((lead) => {
      if (query && !`${lead.name} ${lead.phone}`.toLocaleLowerCase("pt-BR").includes(query)) {
        return false;
      }
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "new", label: "Novos" },
    { value: "distributed", label: "Distribuídos" },
    { value: "in_contact", label: "Em contato" },
    { value: "quote_sent", label: "Cotação" },
    { value: "negotiation", label: "Negociação" },
    { value: "documentation_pending", label: "Documentação" },
    { value: "under_analysis", label: "Em análise" },
    { value: "converted", label: "Convertidos" },
    { value: "lost", label: "Perdidos" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar lead"
            className="h-9 bg-muted pl-8 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            value={search}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/leads" />}
          >
            Ver todos
          </Button>
        </div>
      </div>

      {/* Mobile List */}
      <div className="divide-y divide-border sm:hidden">
        {filteredLeads.map((lead, i) => {
          const statusInfo = statusLabels[lead.status] ?? {
            label: lead.status,
            color: "bg-muted-foreground text-muted-foreground",
          };
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: Math.min(i * 0.02, 0.2) }}
            >
              <Link
                href={`/leads/${lead.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lead.maskPhone}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-block size-1.5 rounded-full ${statusInfo.color.split(" ")[0]}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {sourceLabels[lead.source] ?? lead.source}
                    </span>
                    {lead.taskCount > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-primary">
                          {lead.taskCount} tarefa{lead.taskCount > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
        {filteredLeads.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Nenhum lead encontrado para essa busca."
              : "Nenhum lead na sua fila ainda."}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <Table className="max-sm:hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Lead</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead className="hidden md:table-cell">Criado em</TableHead>
            <TableHead className="hidden md:table-cell">Última interação</TableHead>
            <TableHead className="pr-5 text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead, i) => {
            const statusInfo = statusLabels[lead.status] ?? {
              label: lead.status,
              color: "bg-muted-foreground text-muted-foreground",
            };
            return (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, delay: Math.min(i * 0.01, 0.15) }}
                className="group"
              >
                <TableCell className="pl-5">
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.maskPhone}
                    {lead.taskCount > 0 && (
                      <span className="ml-2 text-primary">
                        · {lead.taskCount} tarefa{lead.taskCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-md text-xs font-normal"
                  >
                    <span
                      className={`inline-block size-1.5 rounded-full ${statusInfo.color.split(" ")[0]}`}
                    />
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sourceLabels[lead.source] ?? lead.source}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                  }).format(lead.createdAt)}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {lead.lastInteractionAt
                    ? new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(lead.lastInteractionAt)
                    : "—"}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    render={<Link href={`/leads/${lead.id}`} />}
                    size="sm"
                    variant="ghost"
                  >
                    Abrir <ArrowRight />
                  </Button>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>

      {/* Empty state */}
      {filteredLeads.length === 0 && (
        <div className="hidden flex-col items-center gap-2 border-t border-border px-6 py-12 text-center sm:flex">
          <p className="font-medium">Nenhum lead encontrado</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Tente ajustar os filtros ou a busca."
              : "Você ainda não tem leads atribuídos. Entre em contato com seu gestor."}
          </p>
        </div>
      )}
    </div>
  );
}
