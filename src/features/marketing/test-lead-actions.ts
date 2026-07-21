"use server";

import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireCentralMetaLeadAdsManager } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { decryptMetaPageToken, createMetaTestLead, deleteMetaTestLead, readMetaTestLeads } from "@/features/marketing/meta-lead-ads";

const inputSchema = z.object({ connectionId: z.string().uuid(), formId: z.string().trim().min(1).max(80) });
const deleteSchema = z.object({ connectionId: z.string().uuid(), formId: z.string().trim().min(1).max(80), leadId: z.string().trim().min(1).max(120) });

async function getConnection(rawConnectionId: string) {
  const context = requireCentralMetaLeadAdsManager(await getRequiredTenantContext());
  const id = z.string().uuid().parse(rawConnectionId);
  const [connection] = await getDatabase().select({ id: schema.marketingConnections.id, accessTokenCiphertext: schema.marketingConnections.accessTokenCiphertext, externalPageId: schema.marketingConnections.externalPageId }).from(schema.marketingConnections).where(and(eq(schema.marketingConnections.id, id), eq(schema.marketingConnections.tenantId, context.tenantId), isNull(schema.marketingConnections.branchId), eq(schema.marketingConnections.status, "active"))).limit(1);
  if (!connection?.accessTokenCiphertext || !connection.externalPageId) throw new Error("Conecte uma Página Meta ativa antes de testar um formulário.");
  return { context, connection, token: decryptMetaPageToken(connection.accessTokenCiphertext) };
}

export async function createMetaTestLeadAction(formData: FormData) {
  try {
    const input = inputSchema.parse(Object.fromEntries(formData));
    const { context, connection, token } = await getConnection(input.connectionId);
    const result = await createMetaTestLead(input.formId, token);
    if (!result.id) throw new Error("A Meta não devolveu o identificador do lead de teste.");
    await getDatabase().insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: connection.id, acao: "meta_test_lead.created" });
    revalidatePath("/marketing");
    return { success: true, leadId: result.id };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível criar o lead de teste." }; }
}

export async function deleteMetaTestLeadAction(formData: FormData) {
  try {
    const input = deleteSchema.parse(Object.fromEntries(formData));
    const { context, connection, token } = await getConnection(input.connectionId);
    const existing = await readMetaTestLeads(input.formId, token);
    if (!(existing.data ?? []).some((lead) => lead.id === input.leadId)) throw new Error("Esse lead não pertence ao formulário informado.");
    await deleteMetaTestLead(input.leadId, token);
    await getDatabase().insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: connection.id, acao: "meta_test_lead.deleted" });
    revalidatePath("/marketing");
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível excluir o lead de teste." }; }
}
