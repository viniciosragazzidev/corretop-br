import "server-only";
import { randomUUID } from "node:crypto";
import { eq, and, or } from "drizzle-orm";
import webpush from "web-push";
import { getDatabase, schema } from "@/shared/db";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:suporte@corretop.com.br",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

export async function sendNotificationToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
) {
  const db = getDatabase();
  const subscriptions = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) return;

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
          title: payload.title,
          body: payload.body,
          icon: "/icon.svg",
          badge: "/icon.svg",
          vibrate: [100, 50, 100],
          data: {
            url: payload.url ?? "/",
            dateOfArrival: Date.now(),
          },
          tag: payload.tag ?? "corretop-notification",
          renotify: true,
          requireInteraction: true,
          actions: [
            { action: "open", title: "Abrir" },
            { action: "close", title: "Fechar" },
          ],
        })
      );
    } catch (error) {
      const err = error as any;
      if (err.statusCode === 410) {
        // Clean up expired subscription
        await db
          .delete(schema.pushSubscriptions)
          .where(eq(schema.pushSubscriptions.id, sub.id));
      }
    }
  }
}

export async function notifyNewLead(
  leadId: string,
  tenantId: string,
  branchId: string | null,
  corretorId: string | null,
  leadName: string
) {
  const db = getDatabase();
  const now = new Date();

  // 1. Notify the assigned broker (if any) — insert into `notifications` table
  //    so the Supabase Realtime subscription catches it and shows toast + sound
  if (corretorId) {
    await Promise.all([
      db.insert(schema.notifications).values({
        id: randomUUID(),
        tenantId,
        recipientUserId: corretorId,
        leadId,
        type: "agent.lead_assigned",
        title: "Novo lead atribuído",
        message: `Você recebeu o lead ${leadName} para atender.`,
        createdAt: now,
      }),
      sendNotificationToUser(corretorId, {
        title: "Novo Lead Atribuído! ⚡",
        body: `O lead "${leadName}" foi distribuído para você.`,
        url: `/leads/${leadId}`,
        tag: `lead-${leadId}`,
      }),
    ]);
  }

  // 2. Query and notify all managers of the branch and directors of the tenant
  //    (push only — managers already get Sonner toasts from the `leads` Supabase
  //     subscription in RealtimeSyncProvider, so we skip `notifications` table
  //     inserts here to avoid duplicate toasts)
  const managers = await db
    .select({ userId: schema.tenantMemberships.userId, role: schema.tenantMemberships.role })
    .from(schema.tenantMemberships)
    .where(
      and(
        eq(schema.tenantMemberships.tenantId, tenantId),
        eq(schema.tenantMemberships.status, "active"),
        or(
          eq(schema.tenantMemberships.role, "director"),
          branchId
            ? and(
                eq(schema.tenantMemberships.role, "manager"),
                eq(schema.tenantMemberships.branchId, branchId)
              )
            : eq(schema.tenantMemberships.role, "manager")
        )
      )
    );

  for (const manager of managers) {
    if (manager.userId === corretorId) continue;

    const isDirector = manager.role === "director";
    await sendNotificationToUser(manager.userId, {
      title: isDirector ? "Novo Lead na Corretora! 🏢" : "Novo Lead na Unidade! 📍",
      body: corretorId
        ? `"${leadName}" chegou e foi distribuído.`
        : `"${leadName}" chegou e está aguardando distribuição.`,
      url: `/leads/${leadId}`,
      tag: `lead-${leadId}`,
    });
  }
}
