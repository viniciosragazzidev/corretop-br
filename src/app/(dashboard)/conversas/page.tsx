import { and, desc, eq, inArray } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { ConversationsWorkspace, type ConversationItem, type ConversationMessage, type PlanSuggestion } from "./conversations-workspace";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export default async function ConversationsPage() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const scope = context.role === "broker"
    ? eq(schema.leads.corretorId, context.userId)
    : context.role === "manager" && context.branchId
      ? eq(schema.leads.branchId, context.branchId)
      : undefined;

  const [leads, availablePlans, connection] = await Promise.all([
    db
      .select({
        id: schema.leads.id,
        nome: schema.leads.nome,
        telefone: schema.leads.telefone,
        email: schema.leads.email,
        status: schema.leads.status,
        origem: schema.leads.origem,
        corretorId: schema.leads.corretorId,
        corretorNome: schema.user.name,
        consentimentoLgpd: schema.leads.consentimentoLgpd,
        createdAt: schema.leads.createdAt,
        stageEnteredAt: schema.leads.stageEnteredAt,
        planName: schema.carrierPlans.name,
        carrierName: schema.carriers.name,
      })
      .from(schema.leads)
      .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
      .leftJoin(schema.carrierPlans, eq(schema.leads.planId, schema.carrierPlans.id))
      .leftJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(and(eq(schema.leads.tenantId, context.tenantId), ...(scope ? [scope] : [])))
      .orderBy(desc(schema.leads.stageEnteredAt))
      .limit(100),
    db
      .select({ id: schema.carrierPlans.id, name: schema.carrierPlans.name, carrierName: schema.carriers.name })
      .from(schema.carrierPlans)
      .innerJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(and(eq(schema.carrierPlans.tenantId, context.tenantId), eq(schema.carrierPlans.active, true), eq(schema.carriers.status, "active")))
      .orderBy(schema.carriers.name, schema.carrierPlans.name)
      .limit(30),
    db
      .select({ active: schema.whatsappConnections.chatInternoAtivo, status: schema.whatsappConnections.status })
      .from(schema.whatsappConnections)
      .where(and(eq(schema.whatsappConnections.tenantId, context.tenantId), eq(schema.whatsappConnections.userId, context.userId)))
      .limit(1),
  ]);

  const leadIds = leads.map((lead) => lead.id);
  const messageRows = leadIds.length
    ? await db
      .select({ id: schema.whatsappMessages.id, leadId: schema.whatsappMessages.leadId, body: schema.whatsappMessages.body, direction: schema.whatsappMessages.direction, sentAt: schema.whatsappMessages.sentAt })
      .from(schema.whatsappMessages)
      .where(and(eq(schema.whatsappMessages.tenantId, context.tenantId), inArray(schema.whatsappMessages.leadId, leadIds)))
      .orderBy(schema.whatsappMessages.sentAt)
    : [];

  const messagesByLead = new Map<string, ConversationMessage[]>();
  for (const message of messageRows) {
    if (!message.leadId) continue;
    const items = messagesByLead.get(message.leadId) ?? [];
    items.push({ ...message, sentAt: message.sentAt.toISOString() });
    messagesByLead.set(message.leadId, items);
  }

  const conversations: ConversationItem[] = leads.map((lead) => {
    const messages = messagesByLead.get(lead.id) ?? [];
    const latest = messages.at(-1) ?? null;
    return {
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      stageEnteredAt: lead.stageEnteredAt.toISOString(),
      latestMessage: latest ? { body: latest.body, direction: latest.direction, sentAt: latest.sentAt } : null,
      messages,
    };
  });

  const plans: PlanSuggestion[] = availablePlans;
  const whatsappReady = connection[0]?.active === true && connection[0]?.status === "ready";

  return (
    <>
      <DashboardHeader breadcrumb="Atendimento" title="Conversas" />
      <main className="min-h-0 flex-1 bg-background p-3 lg:p-4">
        <ConversationsWorkspace
          canSend={context.role === "broker"}
          conversations={conversations}
          plans={plans}
          whatsappReady={whatsappReady}
        />
      </main>
    </>
  );
}
