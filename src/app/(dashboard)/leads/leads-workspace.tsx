"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowUpRight, Phone, SquaresFour, UserList } from "@/components/huge-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAD_STATUS_LABELS } from "@/features/leads/lead-status-constants";

export type LeadWorkspaceItem = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  createdAt: string;
  corretorNome: string | null;
};

const kanbanStatuses = ["new", "in_contact", "quote_sent", "negotiation", "converted"];

const kanbanTone: Record<string, { accent: string; count: string }> = {
  new: { accent: "bg-sky-500", count: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  in_contact: { accent: "bg-violet-500", count: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  quote_sent: { accent: "bg-amber-500", count: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  negotiation: { accent: "bg-orange-500", count: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  converted: { accent: "bg-emerald-500", count: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

export function LeadsWorkspace({ leads, contextRole }: { leads: LeadWorkspaceItem[]; contextRole: string }) {
  const [selectedLead, setSelectedLead] = useState<LeadWorkspaceItem | null>(null);
  const groupedLeads = useMemo(
    () => Object.fromEntries(kanbanStatuses.map((status) => [status, leads.filter((lead) => lead.status === status)])),
    [leads],
  );
  const canCall = selectedLead && !(contextRole === "broker" && selectedLead.status === "distributed");

  return (
    <>
      <Tabs defaultValue="list">
        <TabsList aria-label="Visualização de leads">
          <TabsTrigger value="list"><UserList />Lista</TabsTrigger>
          <TabsTrigger value="kanban"><SquaresFour />Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card className="border-border bg-card shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="hidden lg:table-cell">Entrada</TableHead>
                    <TableHead className="pr-5 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell className="pl-5">
                        <p className="font-medium">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {contextRole === "broker" && lead.status === "distributed" ? maskPhone(lead.telefone) : lead.telefone}
                        </p>
                      </TableCell>
                      <TableCell><StatusBadge status={lead.status} /></TableCell>
                      <TableCell className="hidden md:table-cell">{lead.corretorNome ?? "Aguardando distribuição"}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(lead.createdAt)}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button onClick={(event) => { event.stopPropagation(); setSelectedLead(lead); }} size="sm" variant="outline">
                          Detalhes <ArrowUpRight />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="mt-4 min-w-0">
          <div className="overflow-x-auto pb-3" aria-label="Funil de leads em Kanban">
            <div className="flex min-w-max items-start gap-4">
              {kanbanStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  leads={groupedLeads[status] ?? []}
                  onOpen={setSelectedLead}
                  status={status}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Deslize horizontalmente para acompanhar todas as etapas do funil.</p>
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Detalhes do lead</SheetTitle>
            <SheetDescription>Contexto rápido para decidir o próximo passo sem sair da fila.</SheetDescription>
          </SheetHeader>
          {selectedLead ? (
            <div className="space-y-5 p-4 pt-1">
              <div className="rounded-xl border border-border p-4">
                <p className="text-lg font-semibold">{selectedLead.nome}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contextRole === "broker" && selectedLead.status === "distributed" ? maskPhone(selectedLead.telefone) : selectedLead.telefone}
                </p>
                <div className="mt-4"><StatusBadge status={selectedLead.status} /></div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button render={<Link href={`/cotacoes?leadId=${selectedLead.id}`} />}><ArrowUpRight />Nova cotação</Button>
                  <Button render={<Link href={`/leads/${selectedLead.id}`} />} variant="outline">Ver completo</Button>
                </div>
              </div>
              <div className="grid gap-3 rounded-xl border border-border p-4 text-sm">
                <DetailRow label="Responsável" value={selectedLead.corretorNome ?? "Aguardando distribuição"} />
                <DetailRow label="Origem" value={selectedLead.origem === "manual" ? "Manual" : "Webhook"} />
                <DetailRow label="Entrada" value={formatDate(selectedLead.createdAt)} />
              </div>
              {canCall ? (
                <Button className="w-full" render={<a href={`tel:${selectedLead.telefone}`} />} variant="outline"><Phone />Ligar para o lead</Button>
              ) : (
                <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-muted-foreground">Os dados de contato serão liberados quando você iniciar este atendimento.</p>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function KanbanColumn({ leads, onOpen, status }: { leads: LeadWorkspaceItem[]; onOpen: (lead: LeadWorkspaceItem) => void; status: string }) {
  const tone = kanbanTone[status] ?? kanbanTone.new;

  return (
    <section className="w-72 shrink-0 rounded-xl border border-border bg-muted/30 p-3.5 sm:w-80" aria-labelledby={`kanban-${status}`}>
      <div className="flex min-w-0 items-center gap-2 border-b border-border/70 pb-3">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${tone.accent}`} />
        <h2 id={`kanban-${status}`} className="min-w-0 flex-1 truncate text-sm font-semibold">{statusLabel(status)}</h2>
        <Badge variant="outline" className={`shrink-0 ${tone.count}`}>{leads.length}</Badge>
      </div>

      <div className="mt-3 space-y-3">
        {leads.map((lead) => <KanbanLeadCard key={lead.id} lead={lead} onOpen={onOpen} />)}
        {!leads.length ? (
          <div className="rounded-lg border border-dashed border-border bg-background/40 px-4 py-8 text-center">
            <p className="text-xs font-medium text-muted-foreground">Sem leads nesta etapa</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function KanbanLeadCard({ lead, onOpen }: { lead: LeadWorkspaceItem; onOpen: (lead: LeadWorkspaceItem) => void }) {
  return (
    <button
      className="group w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm outline-none transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onOpen(lead)}
      type="button"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 break-words font-medium leading-5 text-foreground">{lead.nome}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{lead.corretorNome ?? "Sem responsável"}</p>
        </div>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <StatusBadge status={lead.status} />
        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
      </div>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "lost" ? "destructive" : "outline"} className="max-w-full truncate">{statusLabel(status)}</Badge>;
}

function statusLabel(status: string) {
  return (LEAD_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}` : "••••";
}
