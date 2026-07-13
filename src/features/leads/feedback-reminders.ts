import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { getDatabase, schema } from "@/shared/db";

const activeStatuses = ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;

export async function createLeadFeedbackReminders() {
  const db = getDatabase();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const leads = await db.select({ id: schema.leads.id, tenantId: schema.leads.tenantId, corretorId: schema.leads.corretorId, nome: schema.leads.nome }).from(schema.leads).where(and(inArray(schema.leads.status, [...activeStatuses]), isNotNull(schema.leads.corretorId), lt(schema.leads.stageEnteredAt, cutoff)));
  if (!leads.length) return { reminders: 0 };
  const existing = await db.select({ leadId: schema.notifications.leadId, recipientUserId: schema.notifications.recipientUserId }).from(schema.notifications).where(and(eq(schema.notifications.type, "lead_feedback_reminder"), inArray(schema.notifications.leadId, leads.map((lead) => lead.id)), gte(schema.notifications.createdAt, cutoff)));
  const sent = new Set(existing.map((item) => `${item.leadId}:${item.recipientUserId}`));
  const pending = leads.filter((lead) => lead.corretorId && !sent.has(`${lead.id}:${lead.corretorId}`)).map((lead) => ({ id: randomUUID(), tenantId: lead.tenantId, recipientUserId: lead.corretorId!, leadId: lead.id, type: "lead_feedback_reminder", title: "Atualize o atendimento", message: `Registre um feedback sobre ${lead.nome} e atualize o status para manter a operação em dia.`, createdAt: now }));
  if (pending.length) await db.insert(schema.notifications).values(pending);
  return { reminders: pending.length };
}
