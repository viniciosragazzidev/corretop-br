import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, lt, or, isNull } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";
import type { TenantContext } from "@/shared/auth/types";
import { processQueuedLead } from "@/features/lead-distribution/service";

export type FeedbackSlaResult = { checked: number; released: number; reassigned: number; notifications: number };

export async function runFeedbackSlaSweep(tenantId?: string): Promise<FeedbackSlaResult> {
  const db = getDatabase();
  const tenants = await db.select({ id: schema.tenants.id, feedbackRequiredEnabled: schema.tenants.feedbackRequiredEnabled, autoRedistribute: schema.tenants.autoRedistributeOnFeedbackTimeout, firstContactMinutes: schema.tenants.slaFirstContactMinutes, graceMinutes: schema.tenants.feedbackGraceMinutes })
    .from(schema.tenants)
    .where(tenantId ? eq(schema.tenants.id, tenantId) : eq(schema.tenants.status, "active"));
  const result: FeedbackSlaResult = { checked: 0, released: 0, reassigned: 0, notifications: 0 };

  for (const tenant of tenants) {
    if (!tenant.feedbackRequiredEnabled || !tenant.autoRedistribute) continue;
    const minutes = (Number.parseInt(tenant.firstContactMinutes, 10) || 15) + (Number.parseInt(tenant.graceMinutes, 10) || 5);
    const cutoff = new Date(Date.now() - minutes * 60_000);
    const leads = await db.select({ id: schema.leads.id, nome: schema.leads.nome, branchId: schema.leads.branchId, corretorId: schema.leads.corretorId, assignedAt: schema.leads.assignedAt })
      .from(schema.leads)
      .where(and(eq(schema.leads.tenantId, tenant.id), eq(schema.leads.status, "distributed"), isNull(schema.leads.firstContactAt), lt(schema.leads.assignedAt, cutoff), or(eq(schema.leads.distributionStatus, "assigned"), eq(schema.leads.distributionStatus, "queued"))));
    result.checked += leads.length;
    if (!leads.length) continue;
    const [actor] = await db.select({ userId: schema.tenantMemberships.userId }).from(schema.tenantMemberships)
      .where(and(eq(schema.tenantMemberships.tenantId, tenant.id), eq(schema.tenantMemberships.role, "director"), eq(schema.tenantMemberships.status, "active"))).limit(1);
    if (!actor) continue;

    for (const lead of leads) {
      if (!lead.corretorId || !lead.branchId) continue;
      const brokerId = lead.corretorId;
      const now = new Date();
      const released = await db.transaction(async (tx) => {
        const updated = await tx.update(schema.leads).set({ corretorId: null, status: "new", distributionStatus: "queued", assignmentSource: "redistribution", assignmentStrategy: "automatic", assignedAt: null, distributionUpdatedAt: now })
          .where(and(eq(schema.leads.id, lead.id), eq(schema.leads.tenantId, tenant.id), eq(schema.leads.corretorId, brokerId), eq(schema.leads.status, "distributed"), isNull(schema.leads.firstContactAt))).returning({ id: schema.leads.id });
        if (!updated.length) return false;
        await tx.update(schema.leadAssignmentAttempts).set({ status: "overdue", expiredAt: now, releasedAt: now, releaseReason: "feedback_timeout" }).where(and(eq(schema.leadAssignmentAttempts.leadId, lead.id), eq(schema.leadAssignmentAttempts.brokerId, brokerId), eq(schema.leadAssignmentAttempts.status, "open")));
        await tx.insert(schema.leadInteractions).values({ id: randomUUID(), leadId: lead.id, userId: actor.userId, tipo: "system_alert", conteudo: "Lead devolvido à fila por ausência de feedback dentro do SLA." });
        await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: actor.userId, entidade: "lead", entidadeId: lead.id, acao: "lead.feedback_timeout_redistributed" });
        await tx.insert(schema.notifications).values([
          { id: randomUUID(), tenantId: tenant.id, recipientUserId: brokerId, leadId: lead.id, type: "lead_feedback_overdue", title: "Lead devolvido à fila", message: `O lead ${lead.nome} foi devolvido por falta de feedback dentro do SLA.`, createdAt: now },
          { id: randomUUID(), tenantId: tenant.id, recipientUserId: actor.userId, leadId: lead.id, type: "lead_feedback_overdue", title: "Lead redistribuído", message: `O lead ${lead.nome} foi devolvido à fila por falta de feedback.`, createdAt: now },
        ]);
        return true;
      });
      if (!released) continue;
      result.released += 1;
      result.notifications += 2;
      const context: TenantContext = { userId: actor.userId, tenantId: tenant.id, role: "director", branchId: null };
      const reassigned = await processQueuedLead(context, lead.id);
      if (reassigned.status === "assigned") result.reassigned += 1;
    }
  }
  return result;
}
