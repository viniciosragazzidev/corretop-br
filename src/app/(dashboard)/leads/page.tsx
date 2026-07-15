import { and, count, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import Link from "next/link";

import { ManualLeadSheet } from "./_components/manual-lead-sheet";
import { LeadsFilters } from "./_components/leads-filters";
import { LeadsWorkspace } from "./leads-workspace";
import { WifiHigh } from "@/components/huge-icons";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { ContextNote } from "@/components/ui/context-note";
import { getSystemSetting } from "@/features/system-settings/queries";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ attention?: string; status?: string; search?: string; branch?: string; new?: string }> }) {
  const context = await getRequiredTenantContext();
  const filters = await searchParams;
  const db = getDatabase();
  const configuredStagnantDays = Number(await getSystemSetting("feature_central_atencao_stagnant_days") ?? 3);
  const stagnantDays = Number.isInteger(configuredStagnantDays) && configuredStagnantDays >= 1 && configuredStagnantDays <= 30 ? configuredStagnantDays : 3;
  const attention = filters.attention === "unworked" || filters.attention === "stalled" ? filters.attention : null;
  const stalledSince = sql<Date>`now() - (${stagnantDays} * interval '1 day')`;
  const attentionNote = attention === "unworked"
    ? "Exibindo leads novos ou distribuídos que ainda aguardam o primeiro atendimento."
    : attention === "stalled"
      ? `Exibindo leads ativos sem avanço de etapa há mais de ${stagnantDays} dias.`
      : null;
  const leadStatus = filters.status;
  const statusFilter = attention === "unworked"
    ? and(inArray(schema.leads.status, ["new", "distributed"]), isNull(schema.leads.serviceStartedAt))
    : attention === "stalled"
      ? and(inArray(schema.leads.status, ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"]), lt(schema.leads.stageEnteredAt, stalledSince))
      : leadStatus ? eq(schema.leads.status, leadStatus as typeof schema.leadStatusValues[number]) : null;
  const searchFilter = filters.search ? or(ilike(schema.leads.nome, `%${filters.search}%`), ilike(schema.leads.telefone, `%${filters.search}%`)) : null;
  const branchFilter = context.role === "manager" && context.branchId
    ? eq(schema.leads.branchId, context.branchId)
    : context.role === "broker"
      ? eq(schema.leads.corretorId, context.userId)
      : filters.branch ? eq(schema.leads.branchId, filters.branch) : null;
  const where = and(eq(schema.leads.tenantId, context.tenantId), ...(statusFilter ? [statusFilter] : []), ...(searchFilter ? [searchFilter] : []), ...(branchFilter ? [branchFilter] : []));
  const isDirector = context.role === "director";
  const [leads, plans, branches, pausedBranchCount] = await Promise.all([
    db.select({ id: schema.leads.id, nome: schema.leads.nome, telefone: schema.leads.telefone, status: schema.leads.status, origem: schema.leads.origem, createdAt: schema.leads.createdAt, corretorNome: schema.user.name }).from(schema.leads).leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id)).where(where),
    db.select({ id: schema.carrierPlans.id, name: schema.carrierPlans.name, carrierName: schema.carriers.name }).from(schema.carrierPlans).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id)).where(and(eq(schema.carrierPlans.tenantId, context.tenantId), eq(schema.carrierPlans.active, true), eq(schema.carriers.status, "active"))).orderBy(schema.carriers.name, schema.carrierPlans.name),
    db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).where(eq(schema.branches.tenantId, context.tenantId)),
    isDirector
      ? db
          .select({ count: count() })
          .from(schema.branches)
          .where(and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.acceptingLeads, false)))
          .then((r) => Number(r[0]?.count ?? 0))
      : Promise.resolve(0),
  ]);

  return <><DashboardHeader breadcrumb="Operação comercial" title="Leads" /><main className="flex min-h-0 flex-1 flex-col gap-6 bg-background p-4 lg:p-6"><section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-medium text-primary">OPERAÇÃO COMERCIAL</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Sua fila de oportunidades, contatos e próximos passos.</p></div><ManualLeadSheet initiallyOpen={filters.new === "1"} plans={plans} /></section>{attentionNote ? <ContextNote variant="warning">{attentionNote}</ContextNote> : null}{isDirector && pausedBranchCount > 0 ? <div className="flex items-center gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 px-4 py-3"><WifiHigh className="size-5 shrink-0 text-amber-300" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{pausedBranchCount} {pausedBranchCount === 1 ? "filial está com" : "filiais estão com"} recebimento de leads pausado</p><p className="mt-0.5 text-xs text-muted-foreground">Os leads de webhooks não serão roteados para {pausedBranchCount === 1 ? "ela" : "elas"} até que o recebimento seja reativado.</p></div><Button render={<Link href="/leads/distribuicao" />} size="sm" variant="outline" className="shrink-0">Revisar distribuição</Button></div> : null}<LeadsFilters branches={isDirector || context.role === "manager" ? branches : []} initialBranch={filters.branch} initialSearch={filters.search} initialStatus={filters.status} />{leads.length ? <LeadsWorkspace leads={leads.map((lead) => ({ ...lead, createdAt: lead.createdAt.toISOString() }))} contextRole={context.role} /> : <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-12 text-center"><p className="text-sm font-medium">Nenhum lead por enquanto</p><p className="text-xs text-muted-foreground">Cadastre a primeira oportunidade para começar sua fila.</p></div>}</main></>;
}
