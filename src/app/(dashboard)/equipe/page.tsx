import { redirect } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { TeamInviteSection } from "./team-invite-section";
import { TeamMembersTable } from "./team-members-table";

export default async function TeamPage() {
  const context = await getRequiredTenantContext();
  if (context.role === "broker") redirect("/access-denied");

  const [tenant, branches, members, unassignedLeads, salesTotal] = await Promise.all([
    getDatabase()
      .select({ name: schema.tenants.name })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, context.tenantId))
      .limit(1),
    getDatabase()
      .select({ id: schema.branches.id, name: schema.branches.name })
      .from(schema.branches)
      .where(and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active")))
      .orderBy(asc(schema.branches.name)),
    getDatabase()
      .select({
        id: schema.tenantMemberships.id,
        userId: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.tenantMemberships.role,
        jobTitle: schema.tenantMemberships.jobTitle,
        status: schema.user.status,
        branchId: schema.tenantMemberships.branchId,
        branchName: schema.branches.name,
      })
      .from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .leftJoin(schema.branches, eq(schema.tenantMemberships.branchId, schema.branches.id))
      .where(eq(schema.tenantMemberships.tenantId, context.tenantId))
      .orderBy(asc(schema.user.name)),
    getDatabase()
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.leads)
      .where(and(eq(schema.leads.tenantId, context.tenantId), eq(schema.leads.status, "new"))),
    getDatabase()
      .select({ sum: sql<number>`coalesce(sum(${schema.sales.saleValue}), 0)::int` })
      .from(schema.sales)
      .where(eq(schema.sales.tenantId, context.tenantId)),
  ]);

  const activeMembers = members.filter((member) => member.status === "active").length;
  const unassignedCount = unassignedLeads[0]?.count ?? 0;
  const totalVolume = salesTotal[0]?.sum ?? 0;

  return (
    <>
      <DashboardHeader
        breadcrumb={tenant[0]?.name ?? "Gestao"}
        title="Equipe"
        rightSlot={<TeamInviteSection branches={branches} canInviteManager={context.role === "director"} />}
      />
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <section>
          <p className="text-xs font-medium text-primary">GESTAO DE EQUIPE</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Membros da corretora</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {context.role === "director"
              ? "Crie, edite, desative e exclua acessos de Gestores e Corretores por filial."
              : "Acompanhe os acessos da sua filial, edite corretores e gerencie seus estados operacionais."}
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total de membros</p>
              <p className="mt-2 font-mono text-2xl font-semibold">{members.length}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Acessos ativos</p>
              <p className="mt-2 font-mono text-2xl font-semibold">{activeMembers}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Leads sem atendimento</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-amber-500">{unassignedCount}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="border-border bg-card shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Vendas acumuladas</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-emerald-500">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalVolume)}
              </p>
            </CardContent>
          </Card>
        </div>
        <TeamMembersTable
          branches={branches}
          currentBranchId={context.branchId}
          currentRole={context.role}
          currentUserId={context.userId}
          members={members}
        />
      </main>
    </>
  );
}
