"use server";

import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";

import webpush from "web-push";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

// Configure VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:suporte@corretop.com.br",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function subscribeUserAction(sub: PushSubscriptionJSON) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();
  const now = new Date();

  // Check if already subscribed with this endpoint
  const existing = await db
    .select({ id: schema.pushSubscriptions.id })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, sub.endpoint))
    .limit(1);

  if (existing.length > 0) {
    // Update existing subscription
    await db
      .update(schema.pushSubscriptions)
      .set({
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: null, // userAgent não disponível em server actions; pode ser passado como parâmetro se necessário
        updatedAt: now,
      })
      .where(eq(schema.pushSubscriptions.id, existing[0].id));
    return { success: true };
  }

  // Create new subscription
  await db.insert(schema.pushSubscriptions).values({
    id: randomUUID(),
    userId: context.userId,
    tenantId: context.tenantId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,        userAgent: null, // userAgent não disponível em server actions
    createdAt: now,
    updatedAt: now,
  });

  return { success: true };
}

export async function unsubscribeUserAction(endpoint: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  await db
    .delete(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.endpoint, endpoint),
        eq(schema.pushSubscriptions.userId, context.userId),
      ),
    );

  return { success: true };
}

export async function sendTestNotificationAction(message: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const subscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, context.userId));

  if (subscriptions.length === 0) {
    return { success: false, error: "Nenhuma inscrição encontrada. Você precisa se inscrever primeiro." };
  }

  const results: Array<{ endpoint: string; sent: boolean; error?: string }> = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: "CorreTop CRM",
          body: message || "Notificação de teste do CorreTop CRM.",
          icon: "/icon.svg",
          badge: "/icon.svg",
          vibrate: [100, 50, 100],
          data: {
            url: "/",
            dateOfArrival: Date.now(),
          },
          tag: "corretop-test",
          renotify: false,
          requireInteraction: false,
          actions: [
            { action: "open", title: "Abrir" },
            { action: "close", title: "Fechar" },
          ],
        }),
      );
      results.push({ endpoint: sub.endpoint, sent: true });
    } catch (error) {
      const err = error as any;
      // If subscription is invalid (410 Gone), remove it
      if (err.statusCode === 410) {
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.id, sub.id));
        results.push({ endpoint: sub.endpoint, sent: false, error: "Inscrição expirada, removida." });
      } else {
        results.push({
          endpoint: sub.endpoint,
          sent: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }
  }

  const sentCount = results.filter((r) => r.sent).length;
  return {
    success: sentCount > 0,
    sent: sentCount,
    total: subscriptions.length,
    results,
  };
}

export async function getSubscriptionStatusAction() {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const subscriptions = await db
    .select({ id: schema.pushSubscriptions.id, endpoint: schema.pushSubscriptions.endpoint, userAgent: schema.pushSubscriptions.userAgent, createdAt: schema.pushSubscriptions.createdAt })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, context.userId));

  return {
    subscribed: subscriptions.length > 0,
    count: subscriptions.length,
    subscriptions,
  };
}
