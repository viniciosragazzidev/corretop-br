import { count, eq, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { DistributionDashboard } from "./_components/distribution-dashboard";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export const dynamic = "force-dynamic";

const activeStatuses = ["new", "distributed", "in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;

export default async function LeadDistributionPage() {
  const context = await getRequiredTenantContext();
  if (context.role !== "director" && context.role !== "manager") redirect("/access-denied");

  const db = getDatabase();

  // Fetch branches with their distribution flags
  const branchScope = context.role === "manager" && context.branchId
    ? and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.id, context.branchId))
    : eq(schema.branches.tenantId, context.tenantId);
  const branches = await db
    .select({
      id: schema.branches.id,
      name: schema.branches.name,
      status: schema.branches.status,
      acceptingLeads: schema.branches.acceptingLeads,
      autoDistribute: schema.branches.autoDistribute,
    })
    .from(schema.branches)
    .where(branchScope);

  const branchIds = branches.map((b) => b.id);
  if (!branchIds.length) {
    return (
      <>
        <DashboardHeader breadcrumb="Operação comercial" title="Distribuição" />
        <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-4 lg:p-6">
          <p className="text-sm font-medium">Nenhuma filial cadastrada</p>
          <p className="text-xs text-muted-foreground">Crie filiais em /filiais para configurar a distribuição.</p>
        </main>
      </>
    );
  }

  const brokers = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, branchId: schema.tenantMemberships.branchId, availabilityStatus: schema.tenantMemberships.availabilityStatus })
    .from(schema.tenantMemberships)
    .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
    .where(and(eq(schema.tenantMemberships.tenantId, context.tenantId), inArray(schema.tenantMemberships.branchId, branchIds), eq(schema.tenantMemberships.role, "broker"), eq(schema.tenantMemberships.status, "active"), eq(schema.user.active, true)));
  const activeBrokerLeads = await db
    .select({ brokerId: schema.leads.corretorId, count: count(schema.leads.id) })
    .from(schema.leads)
    .where(and(eq(schema.leads.tenantId, context.tenantId), inArray(schema.leads.branchId, branchIds), inArray(schema.leads.status, activeStatuses)))
    .groupBy(schema.leads.corretorId);
  const activeBrokerLeadsMap = new Map(activeBrokerLeads.map((entry) => [entry.brokerId, Number(entry.count)]));

  // Fetch member counts per branch (brokers only)
  const memberCounts = await db
    .select({ branchId: schema.tenantMemberships.branchId, count: count(schema.tenantMemberships.id) })
    .from(schema.tenantMemberships)
    .where(
      and(
        eq(schema.tenantMemberships.tenantId, context.tenantId),
        eq(schema.tenantMemberships.role, "broker"),
        inArray(schema.tenantMemberships.branchId, branchIds),
      ),
    )
    .groupBy(schema.tenantMemberships.branchId);

  // Fetch available broker counts per branch
  const availableCounts = await db
    .select({ branchId: schema.tenantMemberships.branchId, count: count(schema.tenantMemberships.id) })
    .from(schema.tenantMemberships)
    .where(
      and(
        eq(schema.tenantMemberships.tenantId, context.tenantId),
        eq(schema.tenantMemberships.role, "broker"),
        eq(schema.tenantMemberships.availabilityStatus, "available"),
        eq(schema.tenantMemberships.status, "active"),
        inArray(schema.tenantMemberships.branchId, branchIds),
      ),
    )
    .groupBy(schema.tenantMemberships.branchId);

  // Fetch lead counts per branch
  const leadCounts = await db
    .select({ branchId: schema.leads.branchId, count: count(schema.leads.id) })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.tenantId, context.tenantId),
        inArray(schema.leads.branchId, branchIds),
        inArray(schema.leads.status, activeStatuses),
      ),
    )
    .groupBy(schema.leads.branchId);

  // Fetch new/unassigned lead counts per branch
  const newLeadCounts = await db
    .select({ branchId: schema.leads.branchId, count: count(schema.leads.id) })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.tenantId, context.tenantId),
        inArray(schema.leads.branchId, branchIds),
        eq(schema.leads.status, "new"),
      ),
    )
    .groupBy(schema.leads.branchId);

  const countsByBranch = new Map(memberCounts.map((e) => [e.branchId, Number(e.count)]));
  const availableByBranch = new Map(availableCounts.map((e) => [e.branchId, Number(e.count)]));
  const leadsByBranch = new Map(leadCounts.map((e) => [e.branchId, Number(e.count)]));
  const newByBranch = new Map(newLeadCounts.map((e) => [e.branchId, Number(e.count)]));

  const enrichedBranches = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    status: branch.status,
    acceptingLeads: branch.acceptingLeads,
    autoDistribute: branch.autoDistribute,
    memberCount: countsByBranch.get(branch.id) ?? 0,
    availableBrokers: availableByBranch.get(branch.id) ?? 0,
    activeLeads: leadsByBranch.get(branch.id) ?? 0,
    newLeads: newByBranch.get(branch.id) ?? 0,
  }));

  // Overall metrics
  const totalBranches = branches.length;
  const acceptingBranches = branches.filter((b) => b.acceptingLeads).length;
  const autoDistributeBranches = branches.filter((b) => b.autoDistribute).length;
  const totalBrokers = [...countsByBranch.values()].reduce((a, b) => a + b, 0);
  const totalAvailable = [...availableByBranch.values()].reduce((a, b) => a + b, 0);
  const totalNewLeads = [...newByBranch.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <DashboardHeader breadcrumb="Operação comercial" title="Distribuição de Leads" />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">GESTÃO DE DISTRIBUIÇÃO</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Distribuição de leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie quais filiais recebem leads e como a distribuição automática funciona em cada unidade.
            </p>
          </div>
        </section>
        <DistributionDashboard
          branches={enrichedBranches}
          brokers={brokers.map((broker) => ({ id: broker.id, name: broker.name, email: broker.email, availabilityStatus: broker.availabilityStatus, activeLeads: activeBrokerLeadsMap.get(broker.id) ?? 0 }))}
          canManageAcceptingLeads={context.role === "director"}
          metrics={{
            totalBranches,
            acceptingBranches,
            autoDistributeBranches,
            totalBrokers,
            totalAvailable,
            totalNewLeads,
          }}
        />
      </main>
    </>
  );
}
