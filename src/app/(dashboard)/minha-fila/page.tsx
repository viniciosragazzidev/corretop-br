import { and, desc, eq, inArray } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { BrokerQueueClient } from "./_components/queue-client";

const activeLeadStatuses = [
  "new",
  "distributed",
  "in_contact",
  "quote_sent",
  "negotiation",
  "documentation_pending",
  "under_analysis",
] as const;

export const dynamic = "force-dynamic";

export default async function MinhaFilaPage() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const [user, membership, leads] = await Promise.all([
    db
      .select({ name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.id, context.userId))
      .limit(1),
    db
      .select({ availabilityStatus: schema.tenantMemberships.availabilityStatus })
      .from(schema.tenantMemberships)
      .where(
        and(
          eq(schema.tenantMemberships.tenantId, context.tenantId),
          eq(schema.tenantMemberships.userId, context.userId),
        ),
      )
      .limit(1),
    db
      .select({
        id: schema.leads.id,
        name: schema.leads.nome,
        phone: schema.leads.telefone,
        source: schema.leads.origem,
        status: schema.leads.status,
        createdAt: schema.leads.createdAt,
        serviceStartedAt: schema.leads.serviceStartedAt,
        assignedAt: schema.leads.assignedAt,
        stageEnteredAt: schema.leads.stageEnteredAt,
      })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.tenantId, context.tenantId),
          eq(schema.leads.corretorId, context.userId),
        ),
      )
      .orderBy(desc(schema.leads.createdAt)),
  ]);

  // Get last interaction per lead
  const interactions = leads.length
    ? await db
        .select({
          leadId: schema.leadInteractions.leadId,
          createdAt: schema.leadInteractions.createdAt,
        })
        .from(schema.leadInteractions)
        .where(inArray(schema.leadInteractions.leadId, leads.map((l) => l.id)))
        .orderBy(desc(schema.leadInteractions.createdAt))
    : [];

  const latestInteraction = new Map<string, Date>();
  for (const interaction of interactions) {
    if (!latestInteraction.has(interaction.leadId))
      latestInteraction.set(interaction.leadId, interaction.createdAt);
  }

  // Count tasks per lead
  const tasks = leads.length
    ? await db
        .select({
          leadId: schema.leadTasks.leadId,
          count: schema.leadTasks.id,
        })
        .from(schema.leadTasks)
        .where(
          and(
            inArray(schema.leadTasks.leadId, leads.map((l) => l.id)),
            eq(schema.leadTasks.tenantId, context.tenantId),
          ),
        )
    : [];

  const taskCount = new Map<string, number>();
  for (const task of tasks) {
    taskCount.set(task.leadId, (taskCount.get(task.leadId) || 0) + 1);
  }

  const totalLeads = leads.length;
  const urgentLeads = leads.filter(
    (l) => l.status === "new" || l.status === "distributed",
  ).length;
  const inProgress = leads.filter((l) =>
    (["in_contact", "quote_sent", "negotiation"] as const).includes(
      l.status as any,
    ),
  ).length;
  const stalledCount = leads.filter(
    (l) =>
      (activeLeadStatuses as readonly string[]).includes(l.status) &&
      l.stageEnteredAt &&
      Date.now() - l.stageEnteredAt.getTime() > 3 * 24 * 60 * 60 * 1000,
  ).length;

  const enrichedLeads = leads.map((lead) => ({
    ...lead,
    lastInteractionAt: latestInteraction.get(lead.id) ?? null,
    taskCount: taskCount.get(lead.id) ?? 0,
    maskPhone: lead.phone.replace(/\D/g, "").length > 4
      ? `••••${lead.phone.replace(/\D/g, "").slice(-4)}`
      : lead.phone,
  }));

  return (
    <>
      <DashboardHeader
        breadcrumb="Minha operação"
        title="Minha fila"
        rightSlot={
          <div className="flex items-center gap-2">
            <Badge
              variant={urgentLeads > 0 ? "warning" : "success"}
              className="gap-1.5 rounded-md text-xs"
            >
              <span className="relative flex size-2">
                {urgentLeads > 0 && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning/40 opacity-75" />
                )}
                <span
                  className={`relative inline-flex size-2 rounded-full ${urgentLeads > 0 ? "bg-warning" : "bg-success"}`}
                />
              </span>
              {urgentLeads > 0
                ? `${urgentLeads} urgente${urgentLeads > 1 ? "s" : ""}`
                : "Em dia"}
            </Badge>
          </div>
        }
      />
      <main className="flex min-h-full flex-col gap-6 bg-background p-4 lg:p-6">
        {/* Header */}
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">OPERAÇÃO</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Minha fila
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Leads atribuídos a você. Organize por urgência, priorize os
              próximos passos e mantenha o atendimento em dia.
            </p>
          </div>
        </section>

        {/* Metric Cards */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Total na fila",
              value: totalLeads,
              color: "text-foreground",
            },
            {
              label: "Novos / urgentes",
              value: urgentLeads,
              color: urgentLeads > 0 ? "text-warning" : "text-muted-foreground",
            },
            {
              label: "Em andamento",
              value: inProgress,
              color: "text-chart-3",
            },
            {
              label: "Estagnados",
              value: stalledCount,
              color: stalledCount > 0 ? "text-destructive" : "text-muted-foreground",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/40 bg-card p-4 text-center shadow-none"
            >
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Queue */}
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Leads na fila</CardTitle>
                <CardDescription>
                  {totalLeads} lead{totalLeads !== 1 ? "s" : ""} atribuído
                  {totalLeads !== 1 ? "s" : ""} a você
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <BrokerQueueClient
              leads={enrichedLeads}
              userName={user[0]?.name ?? "Corretor"}
              availabilityStatus={
                membership[0]?.availabilityStatus ?? "available"
              }
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
