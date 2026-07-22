import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import webpush from "web-push";

import { createLeadOffersForBrokers } from "@/features/lead-distribution/offers";
import { getDatabase, schema } from "@/shared/db";
import { runWithConcurrency } from "@/shared/async/run-with-concurrency";
import { isNotificationCapabilityEnabled } from "./queries";
import type { NotificationCapabilityId } from "./catalog";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:suporte@corretop.com.br", vapidPublicKey, vapidPrivateKey);
}

export async function sendNotificationToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  const db = getDatabase();
  const subscriptions = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  await runWithConcurrency(subscriptions, 5, async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: "/logo_icon.jpg",
        badge: "/logo_icon.jpg",
        vibrate: [100, 50, 100],
        data: { url: payload.url ?? "/", dateOfArrival: Date.now() },
        tag: payload.tag ?? "corretop-notification",
        renotify: true,
        requireInteraction: true,
        actions: [{ action: "open", title: "Abrir" }, { action: "close", title: "Fechar" }],
      }));
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? error.statusCode : undefined;
      if (statusCode === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id));
    }
  });
}

export async function publishNotification(input: {
  capability: NotificationCapabilityId;
  tenantId: string;
  recipientUserId: string;
  leadId?: string | null;
  type: string;
  title: string;
  message: string;
  pushTitle?: string;
  pushBody?: string;
  url?: string;
  tag?: string;
}) {
  if (!(await isNotificationCapabilityEnabled(input.capability))) return false;
  await getDatabase().insert(schema.notifications).values({
    id: randomUUID(), tenantId: input.tenantId, recipientUserId: input.recipientUserId,
    leadId: input.leadId ?? null, type: input.type, title: input.title, message: input.message, createdAt: new Date(),
  });
  await sendNotificationToUser(input.recipientUserId, { title: input.pushTitle ?? input.title, body: input.pushBody ?? input.message, url: input.url, tag: input.tag });
  return true;
}

export async function notifyNewLead(leadId: string, tenantId: string, branchId: string | null, corretorId: string | null, leadName: string) {
  if (corretorId) {
    await createLeadOffersForBrokers({
      tenantId,
      leadId,
      brokerIds: [corretorId],
      requestedBy: null,
    }).catch((err) => console.error("[notifyNewLead] WhatsApp lead offer error:", err));
  }

  if (!(await isNotificationCapabilityEnabled("lead_assignment"))) return;

  const recipients = await getDatabase()
    .select({ userId: schema.tenantMemberships.userId, role: schema.tenantMemberships.role })
    .from(schema.tenantMemberships)
    .where(and(
      eq(schema.tenantMemberships.tenantId, tenantId),
      eq(schema.tenantMemberships.status, "active"),
      or(
        eq(schema.tenantMemberships.role, "director"),
        branchId ? and(eq(schema.tenantMemberships.role, "manager"), eq(schema.tenantMemberships.branchId, branchId)) : eq(schema.tenantMemberships.role, "manager"),
      ),
    ));

  const targets = [
    ...(corretorId ? [{ userId: corretorId, role: "broker" as const }] : []),
    ...recipients.filter((recipient) => recipient.userId !== corretorId),
  ];

  await Promise.all(targets.map((target) => {
    const isDirector = target.role === "director";
    const isBroker = target.role === "broker";
    return publishNotification({
      capability: "lead_assignment",
      tenantId,
      recipientUserId: target.userId,
      leadId,
      type: "agent.lead_assigned",
      title: isBroker ? "Novo lead atribuído" : isDirector ? "Novo lead na corretora" : "Novo lead na unidade",
      message: isBroker ? `Você recebeu o lead ${leadName} para atender.` : corretorId ? `"${leadName}" chegou e foi distribuído.` : `"${leadName}" chegou e está aguardando distribuição.`,
      pushTitle: isBroker ? "Novo Lead Atribuído! ⚡" : isDirector ? "Novo Lead na Corretora! 🏢" : "Novo Lead na Unidade! 📍",
      pushBody: isBroker ? `O lead "${leadName}" foi distribuído para você.` : corretorId ? `"${leadName}" chegou e foi distribuído.` : `"${leadName}" está aguardando distribuição.`,
      url: `/leads/${leadId}`,
      tag: `lead-${leadId}`,
    });
  }));
}

/**
 * Notify managers and directors about a new lead arrival (pre-distribution).
 * Separate from lead_assignment — focuses on the arrival event itself.
 */
export async function notifyLeadArrived(leadId: string, tenantId: string, branchId: string | null, leadName: string) {
  if (!(await isNotificationCapabilityEnabled("lead_arrived"))) return;

  const recipients = await getDatabase()
    .select({ userId: schema.tenantMemberships.userId, role: schema.tenantMemberships.role })
    .from(schema.tenantMemberships)
    .where(and(
      eq(schema.tenantMemberships.tenantId, tenantId),
      eq(schema.tenantMemberships.status, "active"),
      or(
        eq(schema.tenantMemberships.role, "director"),
        branchId ? and(eq(schema.tenantMemberships.role, "manager"), eq(schema.tenantMemberships.branchId, branchId)) : eq(schema.tenantMemberships.role, "manager"),
      ),
    ));

  await Promise.all(recipients.map((recipient) =>
    publishNotification({
      capability: "lead_arrived",
      tenantId,
      recipientUserId: recipient.userId,
      leadId,
      type: "lead_arrived",
      title: recipient.role === "director" ? "Novo lead na corretora" : "Novo lead na unidade",
      message: `"${leadName}" chegou e ${recipient.role === "director" ? "está disponível na corretora" : "está disponível na unidade"}.`,
      pushTitle: "Novo Lead Chegou! 📥",
      pushBody: `"${leadName}" acabou de chegar no sistema.`,
      url: `/leads/${leadId}`,
      tag: `lead-${leadId}`,
    })
  ));
}

/**
 * Notify the previous broker when a lead is reassigned.
 */
export async function notifyLeadReassigned(leadId: string, tenantId: string, previousOwnerId: string, leadName: string) {
  if (!(await isNotificationCapabilityEnabled("lead_reassigned"))) return;

  await publishNotification({
    capability: "lead_reassigned",
    tenantId,
    recipientUserId: previousOwnerId,
    leadId,
    type: "lead_reassigned",
    title: "Lead reatribuído",
    message: `O lead ${leadName} foi reatribuído a outro corretor e não está mais sob sua responsabilidade.`,
    pushTitle: "Lead Reatribuído 🔄",
    pushBody: `${leadName} foi reatribuído para outro profissional.`,
    url: `/leads/${leadId}`,
    tag: `lead-${leadId}`,
  });
}
