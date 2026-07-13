import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { assertTenantAccess } from "@/shared/auth/authorization";
import { hasPermission } from "@/shared/auth/permissions";
import { AuthorizationError } from "@/shared/auth/errors";
import { getDatabase, schema } from "@/shared/db";
import type { TenantContext } from "@/shared/auth/types";
import {
  LEAD_STATUS_LABELS,
  MOTIVOS_PERDA,
  MOTIVO_PERDA_LABELS,
} from "./lead-status-constants";
import type { MotivoPerda } from "./lead-status-constants";

// ─── Tipos ────────────────────────────────────────────────────────────

export type LeadStatus = (typeof schema.leadStatusValues)[number];

export type ChangeLeadStatusInput = {
  leadId: string;
  newStatus: string;
  motivoPerda?: string | null;
};

export type ChangeLeadStatusResult = {
  success: true;
  previousStatus: string;
  newStatus: string;
  reopened: boolean;
};

// ─── Validação do input ───────────────────────────────────────────────

const changeStatusInput = z.object({
  leadId: z.string().min(1, "ID do lead é obrigatório."),
  newStatus: z.enum(
    schema.leadStatusValues as unknown as [string, ...string[]],
    { message: "Status inválido." },
  ),
  motivoPerda: z.string().optional().nullable(),
});

// ─── Serviço principal ────────────────────────────────────────────────

async function assertCanChangeStatus(
  context: TenantContext,
  lead: { tenantId: string; corretorId: string | null; branchId: string | null; status?: string },
) {
  assertTenantAccess(context, lead.tenantId);

  if (!hasPermission(context.role, "alterar_status_lead")) {
    throw new AuthorizationError("Seu papel não pode alterar status de leads.");
  }

  // Corretor: só pode alterar leads onde é o responsável
  if (context.role === "broker" && context.userId !== lead.corretorId) {
    throw new AuthorizationError("Você só pode alterar status dos seus próprios leads.");
  }

  if (context.role === "broker" && lead.status === "distributed") {
    throw new AuthorizationError("Inicie o atendimento antes de alterar o status deste lead.");
  }

  // Gestor: só pode alterar leads da sua filial
  if (context.role === "manager") {
    if (!lead.branchId || !context.branchId || context.branchId !== lead.branchId) {
      throw new AuthorizationError("Você só pode alterar status de leads da sua filial.");
    }
  }
}

async function assertCanReopen(context: TenantContext) {
  if (!hasPermission(context.role, "reabrir_lead_perdido")) {
    throw new AuthorizationError(
      "Apenas gestores e diretores podem reabrir leads perdidos.",
    );
  }
}

export async function changeLeadStatus(
  rawInput: ChangeLeadStatusInput,
): Promise<ChangeLeadStatusResult> {
  const input = changeStatusInput.parse(rawInput);
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  // Buscar o lead
  const [lead] = await db
    .select({
      id: schema.leads.id,
      tenantId: schema.leads.tenantId,
      corretorId: schema.leads.corretorId,
      branchId: schema.leads.branchId,
      status: schema.leads.status,
      nome: schema.leads.nome,
      telefone: schema.leads.telefone,
      email: schema.leads.email,
    })
    .from(schema.leads)
    .where(and(eq(schema.leads.id, input.leadId), eq(schema.leads.tenantId, context.tenantId)))
    .limit(1);

  if (!lead) {
    throw new Error("Lead não encontrado.");
  }

  const previousStatus = lead.status;
  const newStatus = input.newStatus;

  // ─── Validações de transição ─────────────────────────────────────────

  // 1. convertido: não pode ser selecionado manualmente
  if (false && newStatus === "converted") {
    throw new Error(
      "O status 'Convertido' não pode ser definido manualmente. Ele é atribuído automaticamente ao registrar uma venda.",
    );
  }

  // 2. perdido: exige motivo
  if (newStatus === "lost") {
    if (!input.motivoPerda || !(MOTIVOS_PERDA as readonly string[]).includes(input.motivoPerda)) {
      throw new Error(
        "É obrigatório informar um motivo de perda válido para marcar o lead como perdido.",
      );
    }
    await assertCanChangeStatus(context, lead);
  }

  // 3. Reabertura (saindo de lost)
  const isReopening = previousStatus === "lost" && newStatus !== "lost";

  if (isReopening) {
    await assertCanReopen(context);
  } else {
    await assertCanChangeStatus(context, lead);
  }

  // ─── Executar mudança ───────────────────────────────────────────────
  const now = new Date();
  const motivoPerda = newStatus === "lost" ? input.motivoPerda! : null;

  await db.transaction(async (tx) => {
    // Atualizar lead
    await tx
      .update(schema.leads)
      .set({
        status: newStatus as LeadStatus,
        stageEnteredAt: now,
        motivoPerda,
      })
      .where(eq(schema.leads.id, lead.id));

    // Criar interação na timeline
    const interactionContent = isReopening
      ? `Lead reaberto (${previousStatus} → ${LEAD_STATUS_LABELS[newStatus] ?? newStatus}) por ${context.role === "director" ? "Diretor" : "Gestor"}.`
      : newStatus === "lost"
        ? `Status alterado: ${LEAD_STATUS_LABELS[previousStatus] ?? previousStatus} → Perdido. Motivo: ${MOTIVO_PERDA_LABELS[input.motivoPerda as MotivoPerda] ?? input.motivoPerda}`
        : `Status alterado: ${LEAD_STATUS_LABELS[previousStatus] ?? previousStatus} → ${LEAD_STATUS_LABELS[newStatus] ?? newStatus}.`;

    await tx.insert(schema.leadInteractions).values({
      id: randomUUID(),
      leadId: lead.id,
      userId: context.userId,
      tipo: "status_change",
      conteudo: interactionContent,
    });

    if (newStatus === "converted") {
      await tx.insert(schema.clients).values({
        id: randomUUID(),
        tenantId: context.tenantId,
        leadId: lead.id,
        branchId: lead.branchId,
        corretorId: lead.corretorId,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        convertedAt: now,
      }).onConflictDoNothing({ target: schema.clients.leadId });
    }

    // Criar auditoria
    const auditAction = isReopening
      ? "reabriu"
      : newStatus === "lost"
        ? "perdeu"
        : "alterou";

    await tx.insert(schema.auditLogs).values({
      id: randomUUID(),
      userId: context.userId,
      entidade: "lead",
      entidadeId: lead.id,
      acao: auditAction,
    });

    if (newStatus === "converted") {
      await tx.insert(schema.notifications).values({
        id: randomUUID(),
        tenantId: context.tenantId,
        recipientUserId: context.userId,
        leadId: lead.id,
        type: "lead_converted",
        title: "Lead convertido em cliente",
        message: `${lead.nome} foi convertido e agora está disponível em Clientes.`,
        createdAt: now,
      });
    }
  });

  return {
    success: true,
    previousStatus,
    newStatus,
    reopened: isReopening,
  };
}
