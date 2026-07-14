import { and, eq, ilike, lt, or } from "drizzle-orm";

import { ManualLeadSheet } from "./_components/manual-lead-sheet";
import { LeadsFilters } from "./_components/leads-filters";
import { LeadsWorkspace } from "./leads-workspace";
import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string; branch?: string; new?: string }> }) {
  const context = await getRequiredTenantContext();
  const filters = await searchParams;
  const leadStatus = filters.status;
  const statusFilter = leadStatus === "stalled" ? lt(schema.leads.stageEnteredAt, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) : leadStatus ? eq(schema.leads.status, leadStatus as typeof schema.leadStatusValues[number]) : null;
  const searchFilter = filters.search ? or(ilike(schema.leads.nome, `%${filters.search}%`), ilike(schema.leads.telefone, `%${filters.search}%`)) : null;
  const branchFilter = filters.branch ? eq(schema.leads.branchId, filters.branch) : null;
  const where = and(eq(schema.leads.tenantId, context.tenantId), ...(statusFilter ? [statusFilter] : []), ...(searchFilter ? [searchFilter] : []), ...(branchFilter ? [branchFilter] : []));
  const db = getDatabase();
  const [leads, plans, branches] = await Promise.all([
    db.select({ id: schema.leads.id, nome: schema.leads.nome, telefone: schema.leads.telefone, status: schema.leads.status, origem: schema.leads.origem, createdAt: schema.leads.createdAt, corretorNome: schema.user.name }).from(schema.leads).leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id)).where(where),
    db.select({ id: schema.carrierPlans.id, name: schema.carrierPlans.name, carrierName: schema.carriers.name }).from(schema.carrierPlans).innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id)).where(and(eq(schema.carrierPlans.tenantId, context.tenantId), eq(schema.carrierPlans.active, true), eq(schema.carriers.status, "active"))).orderBy(schema.carriers.name, schema.carrierPlans.name),
    db.select({ id: schema.branches.id, name: schema.branches.name }).from(schema.branches).where(eq(schema.branches.tenantId, context.tenantId)),
  ]);

  return <><DashboardHeader breadcrumb="Operação comercial" title="Leads" /><main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6"><section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-medium text-primary">OPERAÇÃO COMERCIAL</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Sua fila de oportunidades, contatos e próximos passos.</p></div><ManualLeadSheet initiallyOpen={filters.new === "1"} plans={plans} /></section><LeadsFilters branches={context.role === "director" || context.role === "manager" ? branches : []} initialBranch={filters.branch} initialSearch={filters.search} initialStatus={filters.status} />{leads.length ? <LeadsWorkspace leads={leads.map((lead) => ({ ...lead, createdAt: lead.createdAt.toISOString() }))} contextRole={context.role} /> : <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-12 text-center"><p className="text-sm font-medium">Nenhum lead por enquanto</p><p className="text-xs text-muted-foreground">Cadastre a primeira oportunidade para começar sua fila.</p></div>}</main></>;
}
