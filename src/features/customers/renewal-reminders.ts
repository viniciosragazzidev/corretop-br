import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, or } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";

export const RENEWAL_ALERT_WINDOW_DAYS = 30;

export function nextContractAnniversary(convertedAt: Date, now: Date): Date {
  const anniversary = new Date(Date.UTC(
    now.getUTCFullYear(),
    convertedAt.getUTCMonth(),
    convertedAt.getUTCDate(),
  ));

  if (anniversary < startOfDay(now)) anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);
  return anniversary;
}

export function isWithinRenewalWindow(anniversary: Date, now: Date, windowDays = RENEWAL_ALERT_WINDOW_DAYS): boolean {
  const today = startOfDay(now).getTime();
  const end = today + windowDays * 24 * 60 * 60 * 1000;
  return anniversary.getTime() >= today && anniversary.getTime() <= end;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function createClientRenewalReminders(now = new Date()) {
  const db = getDatabase();
  const clients = await db
    .select({
      id: schema.clients.id,
      tenantId: schema.clients.tenantId,
      leadId: schema.clients.leadId,
      branchId: schema.clients.branchId,
      corretorId: schema.clients.corretorId,
      name: schema.clients.nome,
      convertedAt: schema.clients.convertedAt,
    })
    .from(schema.clients);

  const dueClients = clients
    .map((client) => ({ ...client, anniversary: nextContractAnniversary(client.convertedAt, now) }))
    .filter((client) => isWithinRenewalWindow(client.anniversary, now));
  if (!dueClients.length) return { reminders: 0, clients: 0 };

  const existing = await db
    .select({ leadId: schema.notifications.leadId, recipientUserId: schema.notifications.recipientUserId })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.type, "client_renewal_reminder"),
      inArray(schema.notifications.leadId, dueClients.map((client) => client.leadId)),
      gte(schema.notifications.createdAt, startOfDay(now)),
    ));
  const sent = new Set(existing.map((notification) => `${notification.leadId}:${notification.recipientUserId}`));
  const pending: typeof schema.notifications.$inferInsert[] = [];

  for (const client of dueClients) {
    const recipients = await db
      .select({ userId: schema.tenantMemberships.userId })
      .from(schema.tenantMemberships)
      .where(and(
        eq(schema.tenantMemberships.tenantId, client.tenantId),
        eq(schema.tenantMemberships.status, "active"),
        or(
          client.corretorId ? eq(schema.tenantMemberships.userId, client.corretorId) : undefined,
          eq(schema.tenantMemberships.role, "director"),
          and(eq(schema.tenantMemberships.role, "manager"), client.branchId ? eq(schema.tenantMemberships.branchId, client.branchId) : undefined),
        ),
      ));

    for (const recipient of recipients) {
      const key = `${client.leadId}:${recipient.userId}`;
      if (sent.has(key)) continue;
      pending.push({
        id: randomUUID(),
        tenantId: client.tenantId,
        recipientUserId: recipient.userId,
        leadId: client.leadId,
        type: "client_renewal_reminder",
        title: "Renovação próxima",
        message: `${client.name} tem aniversário de contrato em ${new Intl.DateTimeFormat("pt-BR").format(client.anniversary)}. Faça o contato de renovação.`,
        createdAt: now,
      });
      sent.add(key);
    }
  }

  if (pending.length) await db.insert(schema.notifications).values(pending);
  return { reminders: pending.length, clients: dueClients.length };
}
