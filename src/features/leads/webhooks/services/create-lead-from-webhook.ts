import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";
import type { NormalizedLeadData } from "../types/lead-webhook.types";
import { chooseAvailableBroker } from "@/features/leads/assignment";

import { notifyNewLead } from "@/features/notifications/send-push-helper";

export type CreateLeadFromWebhookInput = {
  tenantId: string;
  branchId: string | null;
  credentialId: string;
  createdByUserId: string;
  normalized: NormalizedLeadData;
  deliveryId: string;
};

export async function createLeadFromWebhook(
  input: CreateLeadFromWebhookInput,
): Promise<{ leadId: string }> {
  const db = getDatabase();
  const leadId = randomUUID();
  const { tenantId, normalized, credentialId, createdByUserId, deliveryId, branchId } = input;
  const corretorId = await chooseAvailableBroker(tenantId, branchId);
  const assigned = Boolean(corretorId);

  // Insert lead IMMEDIATELY — Realtime fires as soon as this completes
  await db.insert(schema.leads).values({
    id: leadId,
    tenantId,
    branchId,
    corretorId,
    nome: normalized.name,
    telefone: normalized.phone,
    email: normalized.email,
    origem: "webhook",
    status: assigned ? "distributed" : "new",
    distributionStatus: assigned ? "assigned" : branchId ? "queued" : "unassigned",
    assignmentSource: assigned ? "automatic" : null,
    assignmentStrategy: assigned ? "capacity" : null,
    distributionUpdatedAt: new Date(),
    assignedAt: assigned ? new Date() : null,
    consentimentoLgpd: false,
    externalId: normalized.externalId,
    webhookCredentialId: credentialId,
  });

  // Everything else runs in background — does not block the response or Realtime
  void (async () => {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(schema.leadInteractions).values({
          id: randomUUID(),
          leadId,
          userId: createdByUserId,
          tipo: "note",
          conteudo: assigned ? "Lead recebido por webhook e distribuído automaticamente para um corretor disponível." : "Lead recebido por webhook; aguardando corretor disponível.",
        });

        await tx.insert(schema.auditLogs).values({
          id: randomUUID(),
          userId: createdByUserId,
          entidade: "lead",
          entidadeId: leadId,
          acao: "lead.webhook.received",
        });

        await tx
          .update(schema.webhookDeliveries)
          .set({ status: "processed", leadId, processedAt: new Date() })
          .where(eq(schema.webhookDeliveries.id, deliveryId));
      });

      await notifyNewLead(leadId, tenantId, branchId, corretorId, normalized.name);
    } catch (error) {
      console.error("[webhook] background post-lead error:", error);
    }
  })();

  return { leadId };
}
