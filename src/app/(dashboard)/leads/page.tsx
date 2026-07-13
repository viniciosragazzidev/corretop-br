import { and, eq, ilike, lt, or } from "drizzle-orm";
import { ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";

import { ManualLeadSheet } from "./_components/manual-lead-sheet";
import { LeadsFilters } from "./_components/leads-filters";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string; branch?: string }> }) {
  const context = await getRequiredTenantContext();
  const filters = await searchParams;
  const leadStatus = filters.status;
  const statusFilter = leadStatus === "stalled" ? lt(schema.leads.stageEnteredAt, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) : leadStatus ? eq(schema.leads.status, leadStatus as typeof schema.leadStatusValues[number]) : null;
  const searchFilter = filters.search ? or(ilike(schema.leads.nome, `%${filters.search}%`), ilike(schema.leads.telefone, `%${filters.search}%`)) : null;
  const branchFilter = filters.branch ? eq(schema.leads.branchId, filters.branch) : null;
  const where = and(eq(schema.leads.tenantId, context.tenantId), ...(statusFilter ? [statusFilter] : []), ...(searchFilter ? [searchFilter] : []), ...(branchFilter ? [branchFilter] : []));
  const [leads, plans, branches] = await Promise.all([
    getDatabase()
      .select({
        id: schema.leads.id,
        nome: schema.leads.nome,
        telefone: schema.leads.telefone,
        status: schema.leads.status,
        origem: schema.leads.origem,
        createdAt: schema.leads.createdAt,
        corretorNome: schema.user.name,
      })
      .from(schema.leads)
      .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
      .where(where),
    getDatabase()
      .select({
        id: schema.carrierPlans.id,
        name: schema.carrierPlans.name,
        carrierName: schema.carriers.name,
      })
      .from(schema.carrierPlans)
      .innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(
        and(
          eq(schema.carrierPlans.tenantId, context.tenantId),
          eq(schema.carrierPlans.active, true),
          eq(schema.carriers.status, "active"),
        ),
      )
      .orderBy(schema.carriers.name, schema.carrierPlans.name),
    getDatabase().select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).where(eq(schema.branches.tenantId, context.tenantId)),
  ]);

  return (
    <>
      <DashboardHeader breadcrumb="Operacao comercial" title="Leads" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">OPERACAO COMERCIAL</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua fila de oportunidades, contatos e proximos passos.
            </p>
          </div>
          <ManualLeadSheet plans={plans} />
        </section>

        <LeadsFilters branches={context.role === "director" || context.role === "manager" ? branches : []} initialBranch={filters.branch} initialSearch={filters.search} initialStatus={filters.status} />
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="hidden">
            <Input
              aria-label="Buscar leads"
              className="h-8 flex-1 bg-muted"
              placeholder="Buscar por nome ou telefone"
            />
            <Button aria-label="Filtrar leads" size="icon" variant="outline">
              ⋮
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="pr-5 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="pl-5">
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-xs text-muted-foreground">{context.role === "broker" && lead.status === "distributed" ? maskPhone(lead.telefone) : lead.telefone}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5"><Badge variant={lead.status === "lost" ? "destructive" : "outline"}>{statusLabel(lead.status)}</Badge>{lead.status === "in_contact" || lead.status === "quote_sent" || lead.status === "negotiation" || lead.status === "documentation_pending" || lead.status === "under_analysis" ? <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-200" variant="outline">Atendimento ativo</Badge> : null}</div>
                    </TableCell>
                    <TableCell>{lead.origem === "manual" ? "Manual" : "Webhook"}</TableCell>
                    <TableCell>{lead.corretorNome ? <span className="flex flex-col"><span>{lead.corretorNome}</span>{["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(lead.status) ? <span className="text-xs text-emerald-300">Atendendo agora</span> : null}</span> : "Aguardando distribuição"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR").format(lead.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {!(context.role === "broker" && lead.status === "distributed") ? <Button aria-label={`Ligar para ${lead.nome}`} render={<a href={`tel:${lead.telefone}`} />} size="icon-sm" variant="ghost"><Phone size={15} /></Button> : null}
                        <Button render={<a href={`/leads/${lead.id}`} />} size="sm" variant="outline">Abrir <ArrowUpRight size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center">
                <p className="text-sm font-medium">Nenhum lead por enquanto</p>
                <p className="text-xs text-muted-foreground">
                  Cadastre a primeira oportunidade para comecar sua fila.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}` : "••••";
}

function statusLabel(status: string) {
  return ({ new: "Novo", distributed: "Distribuído", in_contact: "Em atendimento", quote_sent: "Cotação enviada", negotiation: "Negociação", documentation_pending: "Documentação pendente", under_analysis: "Em análise", converted: "Convertido", lost: "Perdido" } as Record<string, string>)[status] ?? status;
}
