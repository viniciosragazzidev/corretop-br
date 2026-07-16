import "server-only";

import { and, count, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { getDatabase, schema } from "@/shared/db";
import { isNotificationCapabilityEnabled } from "@/features/notifications/queries";
import { publishNotification } from "@/features/notifications/send-push-helper";

const activeStatuses = ["in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;

export type FeedbackReminderResult = {
  reminders: number;
  tenants: number;
  skipped: number;
  escalated: number;
};

/**
 * Create feedback reminders for leads that haven't been updated recently.
 *
 * Processes each tenant independently with its own configurable interval,
 * max attempt count, and channel flags (push / toast).
 *
 * When `tenantId` is provided, only that tenant is processed.
 */
export async function createLeadFeedbackReminders(tenantId?: string): Promise<FeedbackReminderResult> {
  if (!(await isNotificationCapabilityEnabled("lead_feedback_reminder"))) {
    return { reminders: 0, tenants: 0, skipped: 0, escalated: 0 };
  }

  const db = getDatabase();
  const now = new Date();

  const tenants = await db
    .select({
      id: schema.tenants.id,
      reminderIntervalMinutes: schema.tenants.feedbackReminderIntervalMinutes,
      maxAttempts: schema.tenants.feedbackReminderMaxAttempts,
      pushEnabled: schema.tenants.feedbackPushEnabled,
      toastEnabled: schema.tenants.feedbackToastEnabled,
    })
    .from(schema.tenants)
    .where(tenantId ? eq(schema.tenants.id, tenantId) : eq(schema.tenants.status, "active"));

  let totalReminders = 0;
  let totalSkipped = 0;
  let totalEscalated = 0;

  for (const tenant of tenants) {
    if (!tenant.toastEnabled && !tenant.pushEnabled) {
      totalSkipped += 1;
      continue;
    }

    const intervalMinutes = Math.max(Number.parseInt(tenant.reminderIntervalMinutes, 10) || 30, 1);
    const maxAttempts = Math.max(tenant.maxAttempts || 5, 1);
    let tenantEscalated = 0;

    // Find leads with active statuses that have been in the same stage beyond the interval
    const cutoff = new Date(now.getTime() - intervalMinutes * 60 * 1000);
    const leads = await db
      .select({
        id: schema.leads.id,
        nome: schema.leads.nome,
        corretorId: schema.leads.corretorId,
        tenantId: schema.leads.tenantId,
      })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.tenantId, tenant.id),
          inArray(schema.leads.status, [...activeStatuses]),
          isNotNull(schema.leads.corretorId),
          lt(schema.leads.stageEnteredAt, cutoff),
        ),
      );

    if (!leads.length) continue;

    // Count existing reminders sent within the current interval window
    const existingReminders = await db
      .select({
        leadId: schema.notifications.leadId,
        recipientUserId: schema.notifications.recipientUserId,
        count: count(schema.notifications.id),
      })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.type, "lead_feedback_reminder"),
          eq(schema.notifications.tenantId, tenant.id),
          inArray(
            schema.notifications.leadId,
            leads.map((l) => l.id),
          ),
          gte(schema.notifications.createdAt, cutoff),
        ),
      )
      .groupBy(schema.notifications.leadId, schema.notifications.recipientUserId);

    const sentCounts = new Map(
      existingReminders.map((r) => [`${r.leadId}:${r.recipientUserId}`, Number(r.count)]),
    );

    const toNotify: Array<{
      tenantId: string;
      recipientUserId: string;
      leadId: string | null;
      type: string;
      title: string;
      message: string;
    }> = [];

    for (const lead of leads) {
      if (!lead.corretorId) continue;
      const key = `${lead.id}:${lead.corretorId}`;
      const attemptCount = sentCounts.get(key) ?? 0;

      if (attemptCount >= maxAttempts) {
        tenantEscalated += 1;
        toNotify.push({
          tenantId: tenant.id,
          recipientUserId: lead.corretorId,
          leadId: lead.id,
          type: "lead_feedback_reminder",
          title: "⚠️ Feedback urgente",
          message: `O lead ${lead.nome} precisa de feedback há mais de ${maxAttempts} períodos. Registre agora para evitar redistribuição.`,
        });
        continue;
      }

      toNotify.push({
        tenantId: tenant.id,
        recipientUserId: lead.corretorId,
        leadId: lead.id,
        type: "lead_feedback_reminder",
        title: "Atualize o atendimento",
        message: `Registre um feedback sobre ${lead.nome} e atualize o status (${attemptCount + 1}/${maxAttempts}).`,
      });
    }

    if (!toNotify.length) continue;

    // Publish notifications (handles both in-app insert + push, respects capability)
    await Promise.allSettled(
      toNotify.map((n) =>
        publishNotification({
          capability: "lead_feedback_reminder",
          tenantId: n.tenantId,
          recipientUserId: n.recipientUserId,
          leadId: n.leadId,
          type: "lead_feedback_reminder",
          title: n.title,
          message: n.message,
          pushBody: n.message,
          url: `/leads/${n.leadId}`,
          tag: `feedback-${n.leadId}`,
        }).catch(() => { /* non-blocking */ }),
      ),
    );

    totalReminders += toNotify.length;

    // Escalate overdue leads to manager/director
    if (tenantEscalated > 0) {
      const supervisors = await db
        .select({ userId: schema.tenantMemberships.userId })
        .from(schema.tenantMemberships)
        .where(
          and(
            eq(schema.tenantMemberships.tenantId, tenant.id),
            eq(schema.tenantMemberships.status, "active"),
            inArray(schema.tenantMemberships.role, ["manager", "director"]),
          ),
        )
        .groupBy(schema.tenantMemberships.userId)
        .limit(5);

      await Promise.allSettled(
        supervisors.map((sup) =>
          publishNotification({
            capability: "lead_feedback_reminder",
            tenantId: tenant.id,
            recipientUserId: sup.userId,
            type: "lead_feedback_reminder",
            title: "Corretor não registrou feedback",
            message: `${tenantEscalated} lead(s) com feedback pendente acima do limite de tentativas. Verifique a operação.`,
            pushBody: `${tenantEscalated} lead(s) precisam de atenção — feedback pendente há mais de ${maxAttempts} períodos.`,
            url: "/minha-fila",
            tag: "feedback-escalated",
          }).catch(() => { /* non-blocking */ }),
        ),
      );
      totalEscalated += tenantEscalated;
    }
  }

  return { reminders: totalReminders, tenants: tenants.length, skipped: totalSkipped, escalated: totalEscalated };
}
