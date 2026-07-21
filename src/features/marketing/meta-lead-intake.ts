import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { decryptMetaPageToken, fetchMetaLead } from "@/features/marketing/meta-lead-ads";
import { normalizeLeadEmail, normalizeLeadName, normalizeLeadPhone } from "@/features/leads/webhooks/utils/lead-webhook.utils";
import { getDatabase, schema } from "@/shared/db";

type MetaEvent = { leadgen_id: string; form_id?: string; ad_id?: string; adgroup_id?: string; campaign_id?: string };

function fieldValue(fieldData: Array<{ name?: string; values?: string[] }> | undefined, names: string[]) {
  const field = fieldData?.find((item) => item.name && names.includes(item.name.toLowerCase()));
  return field?.values?.find(Boolean)?.trim() ?? "";
}

export async function processMetaLeadEvent(input: { eventId: string; connectionId: string; event: MetaEvent }) {
  const db = getDatabase();
  const [connection] = await db.select().from(schema.marketingConnections).where(and(eq(schema.marketingConnections.id, input.connectionId), eq(schema.marketingConnections.status, "active"))).limit(1);
  if (!connection?.accessTokenCiphertext) throw new Error("A conexão Meta não possui um token de Página válido.");
  if (connection.externalFormId && input.event.form_id && connection.externalFormId !== input.event.form_id) throw new Error("O formulário recebido não pertence a esta fonte configurada.");

  const remoteLead = await fetchMetaLead(input.event.leadgen_id, decryptMetaPageToken(connection.accessTokenCiphertext));
  const firstName = fieldValue(remoteLead.field_data, ["first_name"]);
  const lastName = fieldValue(remoteLead.field_data, ["last_name"]);
  const rawName = fieldValue(remoteLead.field_data, ["full_name", "name", "nome"]) || `${firstName} ${lastName}`.trim();
  const rawPhone = fieldValue(remoteLead.field_data, ["phone_number", "phone", "telefone", "celular"]);
  const rawEmail = fieldValue(remoteLead.field_data, ["email", "email_address", "e-mail"]);
  if (!rawName || !rawPhone) throw new Error("O formulário Meta não trouxe nome e telefone utilizáveis.");

  const leadId = randomUUID();
  const now = new Date();
  const inserted = await db.insert(schema.leads).values({
    id: leadId,
    tenantId: connection.tenantId,
    branchId: null,
    corretorId: null,
    nome: normalizeLeadName(rawName),
    telefone: normalizeLeadPhone(rawPhone),
    email: rawEmail ? normalizeLeadEmail(rawEmail) : null,
    origem: "webhook",
    distributionOrigin: "parent",
    status: "new",
    distributionStatus: "unassigned",
    assignmentSource: null,
    assignmentStrategy: null,
    consentimentoLgpd: false,
    externalId: input.event.leadgen_id,
    sourceChannel: connection.platform === "instagram" ? "instagram" : "facebook",
    sourceCampaign: remoteLead.campaign_id ?? input.event.campaign_id ?? null,
    sourceAd: remoteLead.ad_id ?? input.event.ad_id ?? null,
    sourceForm: remoteLead.form_id ?? input.event.form_id ?? null,
    sourceMetadata: { connectionId: connection.id, pageId: connection.externalPageId, adsetId: remoteLead.adset_id ?? input.event.adgroup_id ?? null, receivedAt: now.toISOString() },
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing().returning({ id: schema.leads.id });

  const createdLeadId = inserted[0]?.id;
  if (createdLeadId) {
    await db.transaction(async (tx) => {
      await tx.insert(schema.leadInteractions).values({ id: randomUUID(), leadId: createdLeadId, userId: connection.createdBy, tipo: "note", conteudo: "Lead recebido via formulário nativo da Meta e inserido na fila central para distribuição." });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: connection.createdBy, entidade: "lead", entidadeId: createdLeadId, acao: "lead.meta_lead_ads.received" });
    });
  }
  await db.transaction(async (tx) => {
    await tx.update(schema.marketingWebhookEvents).set({ status: "processed", errorMessage: null, processedAt: now }).where(eq(schema.marketingWebhookEvents.id, input.eventId));
    await tx.update(schema.marketingConnections).set({ lastSyncAt: now, lastError: null, updatedAt: now }).where(eq(schema.marketingConnections.id, connection.id));
  });
  return { leadId: createdLeadId ?? null, duplicate: !createdLeadId };
}

export async function failMetaLeadEvent(input: { eventId: string; connectionId: string; error: unknown }) {
  const message = (input.error instanceof Error ? input.error.message : "Falha ao processar lead Meta.").replace(/[\r\n]+/g, " ").slice(0, 240);
  const now = new Date();
  const db = getDatabase();
  await db.transaction(async (tx) => {
    await tx.update(schema.marketingWebhookEvents).set({ status: "failed", errorMessage: message, processedAt: now }).where(eq(schema.marketingWebhookEvents.id, input.eventId));
    await tx.update(schema.marketingConnections).set({ lastError: message, updatedAt: now }).where(eq(schema.marketingConnections.id, input.connectionId));
  });
}
