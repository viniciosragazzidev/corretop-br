import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, lt, or, sql } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";
import { isNotificationCapabilityEnabled } from "@/features/notifications/queries";

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

/**
 * Client row enriched with the actual contract anniversary date.
 * Uses `activeCustomers.contractAnniversary` when available (more accurate),
 * otherwise falls back to computing anniversary from `clients.convertedAt`.
 */
interface ClientWithAnniversary {
  id: string;
  tenantId: string;
  leadId: string;
  branchId: string | null;
  corretorId: string | null;
  name: string;
  anniversary: Date;
  source: "contract" | "conversion";
}

export async function createClientRenewalReminders(now = new Date()) {
  if (!(await isNotificationCapabilityEnabled("client_renewal"))) return { reminders: 0, clients: 0 };
  const db = getDatabase();

  const today = startOfDay(now);
  const windowEnd = new Date(today.getTime() + RENEWAL_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // ── 1. Fetch clients that have active customer records with contract anniversary ──
  const activeCustomersData = await db
    .select({
      id: schema.clients.id,
      tenantId: schema.clients.tenantId,
      leadId: schema.clients.leadId,
      branchId: schema.clients.branchId,
      corretorId: schema.clients.corretorId,
      name: schema.clients.nome,
      contractAnniversary: schema.activeCustomers.contractAnniversary,
    })
    .from(schema.activeCustomers)
    .innerJoin(schema.clients, eq(schema.activeCustomers.clientId, schema.clients.id))
    .where(
      and(
        eq(schema.activeCustomers.status, "active"),
        gte(schema.activeCustomers.contractAnniversary, today.toISOString().slice(0, 10)),
        lt(schema.activeCustomers.contractAnniversary, windowEnd.toISOString().slice(0, 10)),
      ),
    );

  // ── 2. Fetch remaining clients (without active customer) using convertedAt ──
  const activeClientIds = new Set(activeCustomersData.map((c) => c.id));

  const remainingClients = await db
    .select({
      id: schema.clients.id,
      tenantId: schema.clients.tenantId,
      leadId: schema.clients.leadId,
      branchId: schema.clients.branchId,
      corretorId: schema.clients.corretorId,
      name: schema.clients.nome,
      convertedAt: schema.clients.convertedAt,
    })
    .from(schema.clients)
    .where(and(eq(schema.clients.tenantId, sql`${schema.clients.tenantId}`)));

  const dueClients: ClientWithAnniversary[] = [
    // Clients with active customer record — use actual contract anniversary
    ...activeCustomersData.map((client) => ({
      id: client.id,
      tenantId: client.tenantId,
      leadId: client.leadId,
      branchId: client.branchId,
      corretorId: client.corretorId,
      name: client.name,
      anniversary: new Date(`${client.contractAnniversary}T00:00:00Z`),
      source: "contract" as const,
    })),
    // Clients without active customer record — use convertedAt as fallback
    ...remainingClients
      .filter((c) => !activeClientIds.has(c.id))
      .map((client) => ({ ...client, anniversary: nextContractAnniversary(client.convertedAt, now) }))
      .filter((client) => isWithinRenewalWindow(client.anniversary, now))
      .map((client) => ({
        id: client.id,
        tenantId: client.tenantId,
        leadId: client.leadId,
        branchId: client.branchId,
        corretorId: client.corretorId,
        name: client.name,
        anniversary: client.anniversary,
        source: "conversion" as const,
      })),
  ];

  if (!dueClients.length) return { reminders: 0, clients: 0 };

  // ── 3. Deduplicate against existing notifications today ──
  const existing = await db
    .select({ leadId: schema.notifications.leadId, recipientUserId: schema.notifications.recipientUserId })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.type, "client_renewal_reminder"),
      inArray(schema.notifications.leadId, dueClients.map((c) => c.leadId)),
      gte(schema.notifications.createdAt, today),
    ));
  const sent = new Set(existing.map((n) => `${n.leadId}:${n.recipientUserId}`));
  const pending: typeof schema.notifications.$inferInsert[] = [];

  // ── 4. Build recipients and notifications ──
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
          client.branchId
            ? and(eq(schema.tenantMemberships.role, "manager"), eq(schema.tenantMemberships.branchId, client.branchId))
            : eq(schema.tenantMemberships.role, "manager"),
        ),
      ));

    const diffDays = Math.ceil((client.anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const sourceLabel = client.source === "contract" ? "contrato" : "conversão";
    const title = diffDays <= 7 ? "Renovação iminente! ⏰" : "Renovação próxima 📅";

    for (const recipient of recipients) {
      const key = `${client.leadId}:${recipient.userId}`;
      if (sent.has(key)) continue;
      pending.push({
        id: randomUUID(),
        tenantId: client.tenantId,
        recipientUserId: recipient.userId,
        leadId: client.leadId,
        type: "client_renewal_reminder",
        title,
        message: `${client.name} — aniversário de ${sourceLabel} em ${diffDays} dia${diffDays !== 1 ? "s" : ""} (${new Intl.DateTimeFormat("pt-BR").format(client.anniversary)}). Programe o contato de renovação.`,
        createdAt: now,
      });
      sent.add(key);
    }
  }

  if (pending.length) await db.insert(schema.notifications).values(pending);
  return { reminders: pending.length, clients: dueClients.length };
}
