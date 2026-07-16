import { and, asc, eq } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { QuotesWorkspace } from "./quotes-workspace";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function QuotesPage() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const leadScope = context.role === "broker"
    ? eq(schema.leads.corretorId, context.userId)
    : context.role === "manager" && context.branchId
      ? eq(schema.leads.branchId, context.branchId)
      : undefined;

  const [leads, plans] = await Promise.all([
    db.select({ id: schema.leads.id, nome: schema.leads.nome, status: schema.leads.status, brokerName: schema.user.name, branchName: schema.branches.name })
      .from(schema.leads)
      .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
      .leftJoin(schema.branches, eq(schema.leads.branchId, schema.branches.id))
      .where(and(eq(schema.leads.tenantId, context.tenantId), ...(leadScope ? [leadScope] : [])))
      .orderBy(asc(schema.leads.nome)),
    db.select({ id: schema.carrierPlans.id, name: schema.carrierPlans.name, carrierName: schema.carriers.name, coverage: schema.carrierPlans.coverage })
      .from(schema.carrierPlans)
      .innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(and(eq(schema.carrierPlans.tenantId, context.tenantId), eq(schema.carrierPlans.active, true), eq(schema.carriers.status, "active")))
      .orderBy(asc(schema.carriers.name), asc(schema.carrierPlans.name)),
  ]);

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial" title="Cotações" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section>
          <p className="text-xs font-medium text-primary">OPERAÇÃO COMERCIAL</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Nova cotação</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compare os planos do catálogo e gere uma proposta vinculada a um lead.</p>
        </section>
        <QuotesWorkspace leads={leads} plans={plans} />
      </main>
    </>
  );
}
