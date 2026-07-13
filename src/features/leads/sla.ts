import "server-only";

import { and, eq, gte, inArray, lt, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDatabase, schema } from "@/shared/db";

const activeStatuses = ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;
type SlaKind = "lead_unworked" | "lead_stalled";

export type SlaSweepResult = { tenants: number; unworked: number; stalled: number; notifications: number };

export async function runSlaSweep(tenantId?: string): Promise<SlaSweepResult> {
  const db = getDatabase();
  const tenants = await db.select({ id: schema.tenants.id, firstContactMinutes: schema.tenants.slaFirstContactMinutes, stagnantDays: schema.tenants.slaStagnantDays })
    .from(schema.tenants).where(tenantId ? eq(schema.tenants.id, tenantId) : eq(schema.tenants.status, "active"));
  let unworked = 0;
  let stalled = 0;
  let notifications = 0;
  const now = Date.now();
  for (const tenant of tenants) {
    const firstContactMinutes = Math.max(1, Number.parseInt(tenant.firstContactMinutes, 10) || 15);
    const stagnantDays = Math.max(1, Number.parseInt(tenant.stagnantDays, 10) || 3);
    const unworkedCutoff = new Date(now - firstContactMinutes * 60 * 1000);
    const stagnantCutoff = new Date(now - stagnantDays * 24 * 60 * 60 * 1000);
    const leads = await db.select({ id: schema.leads.id, nome: schema.leads.nome, branchId: schema.leads.branchId, status: schema.leads.status, assignedAt: schema.leads.assignedAt, stageEnteredAt: schema.leads.stageEnteredAt })
      .from(schema.leads).where(and(eq(schema.leads.tenantId, tenant.id), or(and(eq(schema.leads.status, "distributed"), lt(schema.leads.assignedAt, unworkedCutoff)), and(inArray(schema.leads.status, activeStatuses), lt(schema.leads.stageEnteredAt, stagnantCutoff)))));
    if (!leads.length) continue;
    const recipients = await db.select({ userId: schema.tenantMemberships.userId, role: schema.tenantMemberships.role, branchId: schema.tenantMemberships.branchId })
      .from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, tenant.id), eq(schema.tenantMemberships.status, "active"), inArray(schema.tenantMemberships.role, ["manager", "director"])));
    const leadIds = leads.map((lead) => lead.id);
    const existing = await db.select({ recipientUserId: schema.notifications.recipientUserId, leadId: schema.notifications.leadId, type: schema.notifications.type })
      .from(schema.notifications).where(and(eq(schema.notifications.tenantId, tenant.id), inArray(schema.notifications.leadId, leadIds), gte(schema.notifications.createdAt, new Date(now - 24 * 60 * 60 * 1000))));
    const existingKeys = new Set(existing.map((item) => `${item.recipientUserId}:${item.leadId}:${item.type}`));
    const pending: Array<typeof schema.notifications.$inferInsert> = [];
    for (const lead of leads) {
      const kind: SlaKind = lead.status === "distributed" && lead.assignedAt && lead.assignedAt < unworkedCutoff ? "lead_unworked" : "lead_stalled";
      if (kind === "lead_unworked") unworked += 1; else stalled += 1;
      for (const recipient of recipients) {
        if (recipient.role === "manager" && recipient.branchId !== lead.branchId) continue;
        const key = `${recipient.userId}:${lead.id}:${kind}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        pending.push({ id: randomUUID(), tenantId: tenant.id, recipientUserId: recipient.userId, leadId: lead.id, type: kind, title: kind === "lead_unworked" ? "Lead não trabalhado" : "Lead estagnado", message: kind === "lead_unworked" ? `O lead ${lead.nome} está sem primeiro contato há mais de ${firstContactMinutes} minutos.` : `O lead ${lead.nome} está sem avanço há mais de ${stagnantDays} dias.`, createdAt: new Date() });
      }
    }
    if (pending.length) { await db.insert(schema.notifications).values(pending); notifications += pending.length; }
  }
  return { tenants: tenants.length, unworked, stalled, notifications };
}
