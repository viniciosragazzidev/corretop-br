import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import { getDatabase, schema } from "@/shared/db";
import { decryptChannelSecret } from "./secret-crypto";
import { MetaCloudApiError, sendMetaCloudText, sendMetaCloudTemplate } from "./meta-cloud-client";
import { getMetaCloudServerConfig } from "./meta-cloud-config";
import { getMetaWhatsAppTemplate, type MetaWhatsAppTemplatePurpose } from "./templates";
import { META_CLOUD_PROVIDER } from "./types";

const phoneSchema = z.string().trim().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(10).max(15));
const variablesSchema = z.array(z.string().trim().min(1).max(512)).max(10).default([]);

export function buildBrokerInvitationFallbackMessage(input: { name?: string; company?: string; role?: string; token: string }) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://corretop.vercel.app").replace(/\/$/, "");
  const roleLabel = input.role === "manager" ? "Gestor(a)" : input.role === "broker" ? "Corretor(a)" : input.role || "Colaborador(a)";
  const name = input.name?.trim();
  const company = input.company?.trim() || "sua corretora";
  const url = `${baseUrl}/onboarding?token=${encodeURIComponent(input.token)}`;
  const greeting = name ? `✨ *Olá, ${name}!*` : `✨ *Olá!*`;

  return [
    greeting,
    "",
    `Seu acesso à *${company}* foi criado como *${roleLabel}* 🚀`,
    "",
    `👇 *Ative seu acesso pelo link abaixo:*`,
    url,
    "",
    `⚠️ Ignore se não esperava este convite.`,
  ].join("\n");
}

export function buildNewLeadAssignmentFallbackMessage(variables: string[]) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://corretop.vercel.app").replace(/\/$/, "");
  const brokerName = variables[0] || "Corretor";
  const company = variables[1] || "Empresa";
  const leadType = variables[2] || "Pessoa Física";
  const branch = variables[3] || "Unidade";
  const timeout = variables[4] || "3";
  const leadId = variables[5];

  return [
    `🔔 *Novo lead disponível*`,
    "",
    `Olá, ${brokerName}.`,
    "",
    `Um novo lead está disponível para atendimento.`,
    "",
    `*Empresa:* ${company}`,
    `*Tipo de lead:* ${leadType}`,
    `*Unidade:* ${branch}`,
    "",
    `⏱️ Você tem *${timeout} minutos* para aceitar este atendimento.`,
    "",
    `Responda *"Aceitar lead"* para confirmar ou *"Recusar"* para declinar.`,
    ...(leadId ? ["", `Acesse o lead no CorreTop:`, `${baseUrl}/leads/${encodeURIComponent(leadId)}`] : []),
  ].join("\n");
}

export function buildLeadAssignmentConfirmedFallbackMessage(variables: string[]) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://corretop.vercel.app").replace(/\/$/, "");
  const brokerName = variables[0] || "Corretor";
  const clientName = variables[1] || "Cliente";
  const phone = variables[2] || "";
  const leadType = variables[3] || "Pessoa Física";
  const leadId = variables[4] || "";
  const url = `${baseUrl}/leads/${leadId}`;

  return [
    `✅ *Lead atribuído a você*`,
    "",
    `Olá, ${brokerName}.`,
    "",
    `O lead foi atribuído com sucesso ao seu atendimento.`,
    "",
    `*Cliente:* ${clientName}`,
    `*Telefone:* ${phone}`,
    `*Tipo de lead:* ${leadType}`,
    "",
    `👇 *Acesse o CorreTop para iniciar o atendimento:*`,
    url,
  ].join("\n");
}

export function buildLeadAssignmentUnavailableFallbackMessage(variables: string[]) {
  const brokerName = variables[0] || "Corretor";
  return [
    `ℹ️ *Lead não disponível*`,
    "",
    `Olá, ${brokerName}.`,
    "",
    `Este lead já foi atribuído a outro corretor ou não está mais disponível.`,
    "",
    `Nenhuma ação adicional é necessária.`,
  ].join("\n");
}

export function buildLeadAssignmentExpiredFallbackMessage(variables: string[]) {
  const brokerName = variables[0] || "Corretor";
  return [
    `⏰ *Oferta expirada*`,
    "",
    `Olá, ${brokerName}.`,
    "",
    `O prazo para aceitar o lead expirou e ele voltou para a fila de distribuição.`,
    "",
    `Fique atento às próximas oportunidades!`,
  ].join("\n");
}

export const whatsappOutboundStatusValues = ["pending", "queued", "processing", "sent", "delivered", "read", "failed", "cancelled", "expired"] as const;
export type WhatsAppOutboundStatus = (typeof whatsappOutboundStatusValues)[number];

export async function enqueueMetaTemplateMessage(input: {
  tenantId: string;
  channelId?: string;
  recipientType: "lead" | "client" | "user";
  recipientId?: string;
  destinationPhone: string;
  purpose: MetaWhatsAppTemplatePurpose;
  variables?: string[];
  requestedBy?: string | null;
  idempotencyKey: string;
  scheduledAt?: Date;
}) {
  const destinationPhone = phoneSchema.parse(input.destinationPhone);
  const variables = variablesSchema.parse(input.variables ?? []);
  const template = getMetaWhatsAppTemplate(input.purpose);
  if (!template) throw new Error("Modelo de WhatsApp não permitido para esta operação.");
  const db = getDatabase();
  const channelQuery = input.channelId
    ? and(eq(schema.communicationChannels.id, input.channelId), eq(schema.communicationChannels.tenantId, input.tenantId))
    : and(eq(schema.communicationChannels.tenantId, input.tenantId), eq(schema.communicationChannels.provider, META_CLOUD_PROVIDER), eq(schema.communicationChannels.status, "active"), isNull(schema.communicationChannels.branchId), eq(schema.communicationChannels.isDefault, true));
  const [channel] = await db.select({ id: schema.communicationChannels.id }).from(schema.communicationChannels).where(channelQuery).limit(1);
  if (!channel) throw new Error("Nenhum canal corporativo ativo foi configurado.");
  const [existing] = await db.select().from(schema.whatsappOutboundMessages).where(and(eq(schema.whatsappOutboundMessages.tenantId, input.tenantId), eq(schema.whatsappOutboundMessages.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existing) return { id: existing.id, status: existing.status as WhatsAppOutboundStatus, duplicate: true };
  const id = randomUUID();
  const now = new Date();
  await db.insert(schema.whatsappOutboundMessages).values({
    id, tenantId: input.tenantId, channelId: channel.id, recipientType: input.recipientType, recipientId: input.recipientId ?? null,
    destinationPhone, purpose: input.purpose, messageType: "template", templateName: template.name, templateLanguage: template.language, variables,
    status: input.scheduledAt && input.scheduledAt > now ? "pending" : "queued", idempotencyKey: input.idempotencyKey,
    scheduledAt: input.scheduledAt ?? null, queuedAt: now, requestedBy: input.requestedBy ?? null, createdAt: now, updatedAt: now,
  });
  if (input.requestedBy) {
    await db.insert(schema.auditLogs).values({ id: randomUUID(), userId: input.requestedBy, entidade: "whatsapp_outbound_message", entidadeId: id, acao: "whatsapp_message_queued" });
  }
  return { id, status: "queued" as const, duplicate: false };
}

async function enqueueTextFallbackMessage(input: {
  tenantId: string;
  channelId: string;
  recipientType: "lead" | "client" | "user";
  recipientId?: string;
  destinationPhone: string;
  purpose: MetaWhatsAppTemplatePurpose;
  variables: string[];
  requestedBy?: string | null;
}) {
  const db = getDatabase();
  const idempotencyKey = `text-fallback:${input.purpose}:${input.recipientId || input.destinationPhone}:${Date.now()}`;
  const now = new Date();
  const id = randomUUID();
  await db.insert(schema.whatsappOutboundMessages).values({
    id, tenantId: input.tenantId, channelId: input.channelId, recipientType: input.recipientType, recipientId: input.recipientId ?? null,
    destinationPhone: phoneSchema.parse(input.destinationPhone), purpose: input.purpose, messageType: "text",
    templateName: "__text_fallback__", templateLanguage: "pt_BR", variables: variablesSchema.parse(input.variables),
    status: "queued", idempotencyKey, queuedAt: now, requestedBy: input.requestedBy ?? null, createdAt: now, updatedAt: now,
  });
  if (input.requestedBy) {
    await db.insert(schema.auditLogs).values({ id: randomUUID(), userId: input.requestedBy, entidade: "whatsapp_outbound_message", entidadeId: id, acao: "whatsapp_text_fallback_queued" });
  }
  return { id, duplicate: false };
}

export async function processMetaOutboundBatch(limit = 10, tenantId?: string, pass = 0): Promise<{ processed: number; sent: number; failed: number; retried: number }> {
  const db = getDatabase();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const now = new Date();
  const rows = await db.select().from(schema.whatsappOutboundMessages).where(and(tenantId ? eq(schema.whatsappOutboundMessages.tenantId, tenantId) : undefined, or(eq(schema.whatsappOutboundMessages.status, "queued"), eq(schema.whatsappOutboundMessages.status, "pending")), or(lte(schema.whatsappOutboundMessages.scheduledAt, now), isNull(schema.whatsappOutboundMessages.scheduledAt)), or(lte(schema.whatsappOutboundMessages.nextAttemptAt, now), isNull(schema.whatsappOutboundMessages.nextAttemptAt)))).limit(safeLimit);
  let sent = 0;
  let failed = 0;
  let retried = 0;
  let fallbackQueued = 0;
  for (const row of rows) {
    const [claimed] = await db.update(schema.whatsappOutboundMessages).set({ status: "processing", attempts: row.attempts + 1, updatedAt: new Date() }).where(and(eq(schema.whatsappOutboundMessages.id, row.id), or(eq(schema.whatsappOutboundMessages.status, "queued"), eq(schema.whatsappOutboundMessages.status, "pending")))).returning({ id: schema.whatsappOutboundMessages.id });
    if (!claimed) continue;
    try {
      const [channel] = await db.select().from(schema.communicationChannels).where(and(eq(schema.communicationChannels.id, row.channelId), eq(schema.communicationChannels.tenantId, row.tenantId), eq(schema.communicationChannels.provider, META_CLOUD_PROVIDER), eq(schema.communicationChannels.status, "active"))).limit(1);
      if (!channel?.phoneNumberId || !channel.accessTokenCiphertext) throw new Error("Canal corporativo incompleto.");
      const phoneNumberId = channel.phoneNumberId;
      const accessToken = decryptChannelSecret(channel.accessTokenCiphertext, getMetaCloudServerConfig().tokenEncryptionKey);
      let urlButtonParameter: string | undefined;
      let invitation: { tokenCiphertext: string | null; expiresAt: Date; status: string } | undefined;
      if (row.purpose === "brokerInvitation" && row.recipientId) {
        const [loadedInvitation] = await db.select({ tokenCiphertext: schema.brokerInvitations.tokenCiphertext, expiresAt: schema.brokerInvitations.expiresAt, status: schema.brokerInvitations.status }).from(schema.brokerInvitations).where(and(eq(schema.brokerInvitations.id, row.recipientId), eq(schema.brokerInvitations.tenantId, row.tenantId))).limit(1);
        invitation = loadedInvitation;
        const invitationKey = process.env.INVITATION_TOKEN_ENCRYPTION_KEY?.trim() || process.env.META_WHATSAPP_TOKEN_ENCRYPTION_KEY?.trim();
        if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date() || !invitation.tokenCiphertext || !invitationKey) throw new Error("Convite indisponível para entrega.");
        urlButtonParameter = decryptChannelSecret(invitation.tokenCiphertext, invitationKey);
      } else if (row.purpose === "leadAssignmentConfirmed") {
        const variables = Array.isArray(row.variables) ? row.variables.filter((value): value is string => typeof value === "string") : [];
        if (variables[4]) {
          urlButtonParameter = variables[4]; // lead ID/token for dynamic CTA button
        }
      }
      const variables = Array.isArray(row.variables) ? row.variables.filter((value): value is string => typeof value === "string") : [];
      const response = await (row.messageType === "text"
        ? await (async () => {
          let bodyText = "";
          if (row.purpose === "brokerInvitation") {
            const invitationKey = process.env.INVITATION_TOKEN_ENCRYPTION_KEY?.trim() || process.env.META_WHATSAPP_TOKEN_ENCRYPTION_KEY?.trim();
            const ciphertext = invitation?.tokenCiphertext;
            if (!row.recipientId || !ciphertext || !invitationKey) throw new Error("Convite indisponível para entrega.");
            const token = decryptChannelSecret(ciphertext, invitationKey);
            bodyText = buildBrokerInvitationFallbackMessage({ name: variables[0], company: variables[1], role: variables[2], token });
          } else if (row.purpose === "newLeadAssignment") {
            bodyText = buildNewLeadAssignmentFallbackMessage(variables);
          } else if (row.purpose === "leadAssignmentConfirmed") {
            bodyText = buildLeadAssignmentConfirmedFallbackMessage(variables);
          } else if (row.purpose === "leadAssignmentUnavailable") {
            bodyText = buildLeadAssignmentUnavailableFallbackMessage(variables);
          } else if (row.purpose === "leadAssignmentExpired") {
            bodyText = buildLeadAssignmentExpiredFallbackMessage(variables);
          } else {
            bodyText = variables.join("\n");
          }
          return sendMetaCloudText({ phoneNumberId, accessToken, to: row.destinationPhone, body: bodyText });
        })()
        : sendMetaCloudTemplate({ phoneNumberId, accessToken, to: row.destinationPhone, templateName: row.templateName, languageCode: row.templateLanguage, variables: row.purpose === "leadAssignmentConfirmed" ? variables.slice(0, 4) : row.purpose === "newLeadAssignment" ? variables.slice(0, 5) : variables, urlButtonParameter }));
      const providerMessageId = response.messages?.[0]?.id;
      if (!providerMessageId) throw new Error("A Meta não retornou o identificador da mensagem.");
      await db.update(schema.whatsappOutboundMessages).set({ status: "sent", providerMessageId, sentAt: new Date(), updatedAt: new Date(), providerErrorCode: null, providerErrorMessage: null }).where(eq(schema.whatsappOutboundMessages.id, row.id));

      if (row.purpose === "brokerInvitation" && row.recipientId) {
        await db.update(schema.brokerInvitations).set({ deliveryStatus: "sent", deliveryMessageId: providerMessageId, deliveredAt: new Date(), deliveryAttempts: row.attempts + 1, deliveryError: null }).where(and(eq(schema.brokerInvitations.id, row.recipientId), eq(schema.brokerInvitations.tenantId, row.tenantId)));
      } else if (row.purpose === "newLeadAssignment") {
        // Link providerMessageId to lead_offers table if matching
        await db.update(schema.leadOffers).set({ whatsappMessageId: providerMessageId, status: "SENT", updatedAt: new Date() }).where(and(eq(schema.leadOffers.outboundMessageId, row.id), eq(schema.leadOffers.tenantId, row.tenantId)));
      }
      sent += 1;
    } catch (error) {
      const transient = error instanceof MetaCloudApiError && (error.status === 408 || error.status === 409 || error.status === 429 || error.status >= 500);
      const shouldRetry = transient && row.attempts + 1 < 5;
      const safeCode = error instanceof MetaCloudApiError && error.code ? String(error.code) : "outbound_delivery_failed";
      console.error("[whatsapp/outbound] delivery failed", {
        messageId: row.id,
        tenantId: row.tenantId,
        purpose: row.purpose,
        messageType: row.messageType,
        status: error instanceof MetaCloudApiError ? error.status : undefined,
        code: safeCode,
        attempt: row.attempts + 1,
        retrying: shouldRetry,
      });
      const nextAttemptAt = shouldRetry ? new Date(Date.now() + Math.min(3_600_000, 30_000 * 2 ** row.attempts)) : null;
      await db.update(schema.whatsappOutboundMessages).set({ status: shouldRetry ? "queued" : "failed", nextAttemptAt, failedAt: shouldRetry ? null : new Date(), providerErrorCode: safeCode, providerErrorMessage: "Falha de entrega; consulte o histórico operacional.", updatedAt: new Date() }).where(eq(schema.whatsappOutboundMessages.id, row.id));
      const templateDidNotRespond = error instanceof Error && error.message.includes("identificador");

      if (!shouldRetry && row.messageType === "template" && (error instanceof MetaCloudApiError || templateDidNotRespond)) {
        const fallback = await enqueueTextFallbackMessage({
          tenantId: row.tenantId,
          channelId: row.channelId,
          recipientType: row.recipientType as "lead" | "client" | "user",
          recipientId: row.recipientId ?? undefined,
          destinationPhone: row.destinationPhone,
          purpose: row.purpose as MetaWhatsAppTemplatePurpose,
          variables: Array.isArray(row.variables) ? row.variables.filter((value): value is string => typeof value === "string") : [],
          requestedBy: row.requestedBy,
        });
        if (row.requestedBy) {
          await db.insert(schema.auditLogs).values({ id: randomUUID(), userId: row.requestedBy, entidade: "whatsapp_outbound_message", entidadeId: row.id, acao: fallback.duplicate ? "whatsapp_text_fallback_reused" : "whatsapp_template_failed_fallback_queued" });
        }
        if (!fallback.duplicate) fallbackQueued += 1;
      }
      if (shouldRetry) retried += 1; else failed += 1;
    }
  }
  if (fallbackQueued > 0 && pass === 0) {
    const next = await processMetaOutboundBatch(Math.min(safeLimit, fallbackQueued), tenantId, 1);
    return { processed: rows.length + next.processed, sent: sent + next.sent, failed: failed + next.failed, retried: retried + next.retried };
  }
  return { processed: rows.length, sent, failed, retried };
}
