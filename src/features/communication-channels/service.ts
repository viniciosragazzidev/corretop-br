import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { getSystemSetting } from "@/features/system-settings/queries";
import { getDatabase, schema } from "@/shared/db";
import { decryptChannelSecret } from "./secret-crypto";
import { sendMetaCloudText } from "./meta-cloud-client";
import { getMetaCloudServerConfig, META_WHATSAPP_FEATURE_SETTING } from "./meta-cloud-config";
import { META_CLOUD_PROVIDER, type MetaWebhookPayload } from "./types";

export async function isMetaCloudWhatsAppEnabled() {
  return (await getSystemSetting(META_WHATSAPP_FEATURE_SETTING)) === "true";
}

export async function getPreferredMetaCloudChannel(input: { tenantId: string; branchId: string | null; userId: string }) {
  if (!(await isMetaCloudWhatsAppEnabled())) return null;
  const db = getDatabase();
  const base = [
    eq(schema.communicationChannels.tenantId, input.tenantId),
    eq(schema.communicationChannels.provider, META_CLOUD_PROVIDER),
    eq(schema.communicationChannels.status, "active"),
  ];
  const ownedScope = or(isNull(schema.communicationChannels.ownerUserId), eq(schema.communicationChannels.ownerUserId, input.userId));
  const branchChannel = input.branchId
    ? await db.select().from(schema.communicationChannels).where(and(...base, eq(schema.communicationChannels.branchId, input.branchId), ownedScope)).orderBy(desc(schema.communicationChannels.isDefault), desc(schema.communicationChannels.activatedAt)).limit(1)
    : [];
  if (branchChannel[0]) return branchChannel[0];
  const tenantChannel = await db.select().from(schema.communicationChannels).where(and(...base, isNull(schema.communicationChannels.branchId), ownedScope)).orderBy(desc(schema.communicationChannels.isDefault), desc(schema.communicationChannels.activatedAt)).limit(1);
  return tenantChannel[0] ?? null;
}

export async function sendMetaCloudChannelText(input: { channel: NonNullable<Awaited<ReturnType<typeof getPreferredMetaCloudChannel>>>; to: string; body: string }) {
  if (!input.channel.phoneNumberId || !input.channel.accessTokenCiphertext) throw new Error("O canal oficial está incompleto. Reconecte-o nas configurações.");
  const config = getMetaCloudServerConfig();
  const accessToken = decryptChannelSecret(input.channel.accessTokenCiphertext, config.tokenEncryptionKey);
  const response = await sendMetaCloudText({ phoneNumberId: input.channel.phoneNumberId, accessToken, to: input.to, body: input.body });
  const messageId = response.messages?.[0]?.id;
  if (!messageId) throw new Error("A Meta não retornou o identificador da mensagem.");
  return { messageId };
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function samePhone(left: string, right: string) {
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  return Boolean(a && b) && (a === b || a.endsWith(b) || b.endsWith(a) || a.slice(-11) === b.slice(-11));
}

async function registerWebhookEvent(input: { channelId: string | null; externalEventId: string; eventType: string; payloadHash: string }) {
  const [event] = await getDatabase().insert(schema.communicationChannelWebhookEvents).values({
    id: randomUUID(), channelId: input.channelId, provider: META_CLOUD_PROVIDER, externalEventId: input.externalEventId, eventType: input.eventType, payloadHash: input.payloadHash,
  }).onConflictDoNothing().returning({ id: schema.communicationChannelWebhookEvents.id });
  return event?.id ?? null;
}

async function setWebhookEventResult(id: string, status: string, errorCode?: string) {
  await getDatabase().update(schema.communicationChannelWebhookEvents).set({ status, errorCode: errorCode ?? null, processedAt: new Date() }).where(eq(schema.communicationChannelWebhookEvents.id, id));
}

export async function ingestMetaCloudWebhook(payload: MetaWebhookPayload, rawPayload: string) {
  const payloadHash = createHash("sha256").update(rawPayload).digest("hex");
  if (payload.object !== "whatsapp_business_account") return { processed: 0, ignored: 1 };
  let processed = 0;
  let ignored = 0;
  const db = getDatabase();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const phoneNumberId = change.value?.metadata?.phone_number_id;
      if (!phoneNumberId) { ignored += 1; continue; }
      const [channel] = await db.select().from(schema.communicationChannels).where(and(eq(schema.communicationChannels.provider, META_CLOUD_PROVIDER), eq(schema.communicationChannels.phoneNumberId, phoneNumberId))).limit(1);
      if (!channel || channel.status !== "active") {
        await registerWebhookEvent({ channelId: channel?.id ?? null, externalEventId: `unknown:${payloadHash}`, eventType: "messages", payloadHash });
        ignored += 1;
        continue;
      }
      await db.update(schema.communicationChannels).set({ lastWebhookAt: new Date(), updatedAt: new Date() }).where(eq(schema.communicationChannels.id, channel.id));

      for (const message of change.value?.messages ?? []) {
        const eventId = await registerWebhookEvent({ channelId: channel.id, externalEventId: message.id, eventType: `message.${message.type ?? "unknown"}`, payloadHash });
        if (!eventId) continue;
        const text = message.type === "text" ? message.text?.body?.trim() : "";
        if (!text) { await setWebhookEventResult(eventId, "discarded", "unsupported_message_type"); ignored += 1; continue; }
        const phone = normalizePhone(message.from);
        const [leads, clients] = await Promise.all([
          db.select({ id: schema.leads.id, phone: schema.leads.telefone, status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.tenantId, channel.tenantId)),
          db.select({ id: schema.clients.id, phone: schema.clients.telefone }).from(schema.clients).where(eq(schema.clients.tenantId, channel.tenantId)),
        ]);
        const matchingLeads = leads.filter((item) => samePhone(item.phone, phone));
        const lead = matchingLeads.find((item) => ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"].includes(item.status)) ?? matchingLeads[0];
        const client = clients.find((item) => samePhone(item.phone, phone));
        if (!lead && !client) { await setWebhookEventResult(eventId, "discarded", "unmatched_contact"); ignored += 1; continue; }
        await db.insert(schema.whatsappMessages).values({
          id: randomUUID(), tenantId: channel.tenantId, leadId: lead?.id ?? null, clientId: client?.id ?? null, communicationChannelId: channel.id, provider: META_CLOUD_PROVIDER, providerStatus: "received", messageId: message.id, phone, direction: "incoming", body: text,
          sentAt: message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date(),
        }).onConflictDoNothing({ target: [schema.whatsappMessages.tenantId, schema.whatsappMessages.messageId] });
        await setWebhookEventResult(eventId, "processed");
        processed += 1;
      }

      for (const status of change.value?.statuses ?? []) {
        const eventId = await registerWebhookEvent({ channelId: channel.id, externalEventId: `${status.id}:${status.status}`, eventType: "message.status", payloadHash });
        if (!eventId) continue;
        await db.update(schema.whatsappMessages).set({ providerStatus: status.status }).where(and(eq(schema.whatsappMessages.tenantId, channel.tenantId), eq(schema.whatsappMessages.messageId, status.id), eq(schema.whatsappMessages.provider, META_CLOUD_PROVIDER)));
        await setWebhookEventResult(eventId, "processed");
        processed += 1;
      }
    }
  }
  return { processed, ignored };
}
