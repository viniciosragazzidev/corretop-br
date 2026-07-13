"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertTenantAccess } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

type Database = ReturnType<typeof getDatabase>;
type InteractionWriter = Pick<Database, "insert">;

export type LeadNoteState = { success?: boolean; error?: string };

const noteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().trim().min(1, "A nota não pode ficar vazia.").max(2000, "A nota deve ter no máximo 2.000 caracteres."),
});

export async function createLeadInteraction(
  db: InteractionWriter,
  data: {
    leadId: string;
    userId: string;
    tipo: (typeof schema.leadInteractionTypeValues)[number];
    conteudo: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(schema.leadInteractions).values({
    id: randomUUID(),
    leadId: data.leadId,
    userId: data.userId,
    tipo: data.tipo,
    conteudo: data.conteudo,
    metadata: data.metadata,
  });
}

export async function addLeadNoteAction(
  _previous: LeadNoteState,
  formData: FormData,
): Promise<LeadNoteState> {
  const parsed = noteSchema.safeParse({
    leadId: formData.get("leadId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getRequiredTenantContext();
    const db = getDatabase();
    const [lead] = await db
      .select({ id: schema.leads.id, tenantId: schema.leads.tenantId, corretorId: schema.leads.corretorId, branchId: schema.leads.branchId })
      .from(schema.leads)
      .where(and(eq(schema.leads.id, parsed.data.leadId), eq(schema.leads.tenantId, context.tenantId)))
      .limit(1);

    if (!lead) return { error: "Lead não encontrado." };
    assertTenantAccess(context, lead.tenantId);
    if (context.role === "broker" && lead.corretorId !== context.userId) return { error: "Você só pode registrar notas nos seus leads." };
    if (context.role === "manager" && (!context.branchId || lead.branchId !== context.branchId)) return { error: "Você só pode registrar notas na sua filial." };

    await createLeadInteraction(db, {
      leadId: lead.id,
      userId: context.userId,
      tipo: "note",
      conteudo: parsed.data.content,
    });
    revalidatePath(`/leads/${lead.id}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar a nota." };
  }
}
