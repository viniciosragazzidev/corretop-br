import { and, asc, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { ConversationsWorkspace, type ConversationItem, type ConversationMessage, type PlanSuggestion } from "./conversations-workspace";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { getPreferredMetaCloudChannel } from "@/features/communication-channels/service";

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ leadId?: string; setup?: string }> }) {
  const { leadId, setup } = await searchParams;
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const isDirector = context.role === "director";
  const scope = context.role === "broker"
    ? eq(schema.leads.corretorId, context.userId)
    : context.role === "manager" && context.branchId
      ? eq(schema.leads.branchId, context.branchId)
      : undefined;

  const [leads, availablePlans, connection, branches, officialChannel] = await Promise.all([
    db
      .select({
        id: schema.leads.id,
        nome: schema.leads.nome,
        telefone: schema.leads.telefone,
        email: schema.leads.email,
        status: schema.leads.status,
        origem: schema.leads.origem,
        branchId: schema.leads.branchId,
        corretorId: schema.leads.corretorId,
        corretorNome: schema.user.name,
        branchName: schema.branches.name,
        consentimentoLgpd: schema.leads.consentimentoLgpd,
        createdAt: schema.leads.createdAt,
        stageEnteredAt: schema.leads.stageEnteredAt,
        planName: schema.carrierPlans.name,
        carrierName: schema.carriers.name,
      })
      .from(schema.leads)
      .leftJoin(schema.user, eq(schema.leads.corretorId, schema.user.id))
      .leftJoin(schema.branches, eq(schema.leads.branchId, schema.branches.id))
      .leftJoin(schema.carrierPlans, eq(schema.leads.planId, schema.carrierPlans.id))
      .leftJoin(schema.carriers, eq(schema.carrierPlans.carrierId, schema.carriers.id))
      .where(and(eq(schema.leads.tenantId, context.tenantId), isNotNull(schema.leads.serviceStartedAt), ...(scope ? [scope] : [])))
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
    isDirector
      ? db
          .select({ id: schema.branches.id, name: schema.branches.name })
          .from(schema.branches)
          .where(and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active")))
          .orderBy(asc(schema.branches.name))
      : Promise.resolve([] as { id: string; name: string }[]),
    getPreferredMetaCloudChannel({ tenantId: context.tenantId, branchId: context.branchId, userId: context.userId }),
  ]);

  const leadIds = leads.map((lead) => lead.id);
  
  const messagesSubquery = leadIds.length
    ? db
        .select({
          id: schema.whatsappMessages.id,
          leadId: schema.whatsappMessages.leadId,
          body: schema.whatsappMessages.body,
          direction: schema.whatsappMessages.direction,
          sentAt: schema.whatsappMessages.sentAt,
          rn: sql<number>`row_number() over (partition by ${schema.whatsappMessages.leadId} order by ${schema.whatsappMessages.sentAt} desc)`.as("rn")
        })
        .from(schema.whatsappMessages)
        .where(
          and(
            eq(schema.whatsappMessages.tenantId, context.tenantId),
            inArray(schema.whatsappMessages.leadId, leadIds)
          )
        )
        .as("msg_sq")
    : null;

  const [messageRows, documentRows] = leadIds.length && messagesSubquery
    ? await Promise.all([
      db
        .select({
          id: messagesSubquery.id,
          leadId: messagesSubquery.leadId,
          body: messagesSubquery.body,
          direction: messagesSubquery.direction,
          sentAt: messagesSubquery.sentAt
        })
        .from(messagesSubquery)
        .where(lt(messagesSubquery.rn, 21))
        .orderBy(messagesSubquery.sentAt),
      db
        .select({ id: schema.leadDocuments.id, leadId: schema.leadDocuments.leadId, filename: schema.leadDocuments.filename, fileUrl: schema.leadDocuments.fileUrl, status: schema.leadDocuments.status, requirementName: schema.documentRequirements.name, createdAt: schema.leadDocuments.createdAt })
        .from(schema.leadDocuments)
        .leftJoin(schema.documentRequirements, eq(schema.leadDocuments.requirementId, schema.documentRequirements.id))
        .where(and(eq(schema.leadDocuments.tenantId, context.tenantId), inArray(schema.leadDocuments.leadId, leadIds)))
        .orderBy(desc(schema.leadDocuments.createdAt)),
    ])
    : [[], []] as const;

  const messagesByLead = new Map<string, ConversationMessage[]>();
  for (const message of messageRows) {
    if (!message.leadId) continue;
    const items = messagesByLead.get(message.leadId) ?? [];
    items.push({ ...message, sentAt: message.sentAt.toISOString() });
    messagesByLead.set(message.leadId, items);
  }

  const documentsByLead = new Map<string, { id: string; filename: string; fileUrl: string; status: string; requirementName: string | null; createdAt: string }[]>();
  for (const document of documentRows) {
    const items = documentsByLead.get(document.leadId) ?? [];
    items.push({ ...document, createdAt: document.createdAt.toISOString() });
    documentsByLead.set(document.leadId, items);
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
      documents: documentsByLead.get(lead.id) ?? [],
    };
  });

  const plans: PlanSuggestion[] = availablePlans;
  const whatsappSessionReady = Boolean(officialChannel) || connection[0]?.status === "ready";
  const whatsappReady = Boolean(officialChannel) || (connection[0]?.active === true && connection[0]?.status === "ready");

  return (
    <>
      <DashboardHeader breadcrumb="Atendimento" title="Conversas" />
      <main className="min-h-0 flex-1 bg-background p-3 lg:p-4">
        <ConversationsWorkspace
          role={context.role}
          branches={branches}
          canSend={context.role === "broker"}
          conversations={conversations}
          initialLeadId={leadId}
          plans={plans}
          whatsappReady={whatsappReady}
          whatsappSessionReady={whatsappSessionReady}
          setupOpen={setup === "whatsapp"}
        />
      </main>
    </>
  );
}
