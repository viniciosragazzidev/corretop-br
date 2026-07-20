"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { and, count, eq, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { generateWebhookToken } from "@/features/leads/webhooks/utils/lead-webhook.utils";

const sourceSchema = z.enum(["site_pixel", "meta_ads", "landing_page"]);
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  source: sourceSchema,
  branchId: z.string().uuid().optional().or(z.literal("")),
});
const idSchema = z.object({ id: z.string().uuid() });

export type IntegrationRecord = {
  id: string;
  name: string;
  source: string;
  branchId: string | null;
  branchName: string | null;
  status: "active" | "revoked";
  tokenPrefix: string;
  createdAt: Date;
  stats: { received: number; processed: number; failed: number };
};

export type IntegrationActionState = {
  success?: boolean;
  error?: string;
  token?: string;
  integration?: IntegrationRecord;
};

export type MarketingConnectionRecord = {
  id: string;
  name: string;
  platform: string;
  branchId: string | null;
  branchName: string | null;
  externalPageId: string | null;
  externalFormId: string | null;
  status: "active" | "inactive" | "error";
  lastWebhookAt: Date | null;
  lastSyncAt: Date | null;
  lastError: string | null;
  stats: { webhookEvents: number; clicks: number; impressions: number; spend: string };
};

const marketingConnectionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  platform: z.enum(["facebook", "instagram"]),
  externalPageId: z.string().trim().min(1).max(80),
  externalFormId: z.string().trim().max(80).optional().or(z.literal("")),
  branchId: z.string().uuid().optional().or(z.literal("")),
});

async function requireDirector() {
  return requireRole(await getRequiredTenantContext(), "director");
}

export async function getIntegrationsData() {
  const context = await requireDirector();
  const db = getDatabase();
  const [integrations, branches, marketingRows] = await Promise.all([
    db.select({
      id: schema.leadWebhookCredentials.id,
      name: schema.leadWebhookCredentials.name,
      source: schema.leadWebhookCredentials.source,
      branchId: schema.leadWebhookCredentials.branchId,
      branchName: schema.branches.name,
      status: schema.leadWebhookCredentials.status,
      tokenPrefix: schema.leadWebhookCredentials.tokenPrefix,
      createdAt: schema.leadWebhookCredentials.createdAt,
    }).from(schema.leadWebhookCredentials)
      .leftJoin(schema.branches, eq(schema.leadWebhookCredentials.branchId, schema.branches.id))
      .where(eq(schema.leadWebhookCredentials.tenantId, context.tenantId)),
    db.select({ id: schema.branches.id, name: schema.branches.name })
      .from(schema.branches)
      .where(and(eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active"))),
    db.select({
      id: schema.marketingConnections.id,
      name: schema.marketingConnections.name,
      platform: schema.marketingConnections.platform,
      branchId: schema.marketingConnections.branchId,
      branchName: schema.branches.name,
      externalPageId: schema.marketingConnections.externalPageId,
      externalFormId: schema.marketingConnections.externalFormId,
      status: schema.marketingConnections.status,
      lastWebhookAt: schema.marketingConnections.lastWebhookAt,
      lastSyncAt: schema.marketingConnections.lastSyncAt,
      lastError: schema.marketingConnections.lastError,
    }).from(schema.marketingConnections)
      .leftJoin(schema.branches, eq(schema.marketingConnections.branchId, schema.branches.id))
      .where(eq(schema.marketingConnections.tenantId, context.tenantId)),
  ]);
  const integrationsWithStats: IntegrationRecord[] = await Promise.all(integrations.map(async (integration) => {
    const [received, processed, failed] = await Promise.all([
      db.select({ total: count(schema.webhookDeliveries.id) }).from(schema.webhookDeliveries).where(eq(schema.webhookDeliveries.credentialId, integration.id)),
      db.select({ total: count(schema.webhookDeliveries.id) }).from(schema.webhookDeliveries).where(and(eq(schema.webhookDeliveries.credentialId, integration.id), eq(schema.webhookDeliveries.status, "processed"))),
      db.select({ total: count(schema.webhookDeliveries.id) }).from(schema.webhookDeliveries).where(and(eq(schema.webhookDeliveries.credentialId, integration.id), eq(schema.webhookDeliveries.status, "failed"))),
    ]);
    return { ...integration, stats: { received: Number(received[0]?.total ?? 0), processed: Number(processed[0]?.total ?? 0), failed: Number(failed[0]?.total ?? 0) } };
  }));
  const marketingConnections: MarketingConnectionRecord[] = await Promise.all(marketingRows.map(async (connection) => {
    const [events, metrics] = await Promise.all([
      db.select({ total: count(schema.marketingWebhookEvents.id) }).from(schema.marketingWebhookEvents).where(eq(schema.marketingWebhookEvents.connectionId, connection.id)),
      db.select({ clicks: sum(schema.marketingDailyMetrics.clicks), impressions: sum(schema.marketingDailyMetrics.impressions), spend: sum(schema.marketingDailyMetrics.spend) }).from(schema.marketingDailyMetrics).where(eq(schema.marketingDailyMetrics.connectionId, connection.id)),
    ]);
    return { ...connection, stats: { webhookEvents: Number(events[0]?.total ?? 0), clicks: Number(metrics[0]?.clicks ?? 0), impressions: Number(metrics[0]?.impressions ?? 0), spend: String(metrics[0]?.spend ?? "0") } };
  }));
  return { integrations: integrationsWithStats, branches, marketingConnections };
}

export async function createIntegrationAction(
  _previous: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  try {
    const context = await requireDirector();
    const input = createSchema.parse(Object.fromEntries(formData));
    const db = getDatabase();
    const branchId = input.branchId || null;
    if (branchId) {
      const [branch] = await db.select({ id: schema.branches.id }).from(schema.branches)
        .where(and(eq(schema.branches.id, branchId), eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active"))).limit(1);
      if (!branch) return { error: "A filial selecionada não pertence à corretora ativa." };
    }
    const token = generateWebhookToken();
    const id = randomUUID();
    await db.insert(schema.leadWebhookCredentials).values({
      id,
      tenantId: context.tenantId,
      branchId,
      name: input.name,
      source: input.source,
      tokenPrefix: token.tokenPrefix,
      tokenHash: token.tokenHash,
      status: "active",
      createdBy: context.userId,
    });
    revalidatePath("/settings");
    return {
      success: true,
      token: token.rawToken,
      integration: { id, name: input.name, source: input.source, branchId, branchName: null, status: "active", tokenPrefix: token.tokenPrefix, createdAt: new Date(), stats: { received: 0, processed: 0, failed: 0 } },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível criar a integração." };
  }
}

export async function toggleIntegrationAction(formData: FormData) {
  try {
    const context = await requireDirector();
    const { id } = idSchema.parse(Object.fromEntries(formData));
    const db = getDatabase();
    const [integration] = await db.select({ id: schema.leadWebhookCredentials.id, status: schema.leadWebhookCredentials.status })
      .from(schema.leadWebhookCredentials).where(and(eq(schema.leadWebhookCredentials.id, id), eq(schema.leadWebhookCredentials.tenantId, context.tenantId))).limit(1);
    if (!integration) return { success: false, error: "Integração não encontrada." };
    await db.update(schema.leadWebhookCredentials).set({ status: integration.status === "active" ? "revoked" : "active", revokedAt: integration.status === "active" ? new Date() : null, updatedAt: new Date() }).where(eq(schema.leadWebhookCredentials.id, id));
    revalidatePath("/settings");
    return { success: true, status: integration.status === "active" ? "revoked" : "active" as const };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar a integração." };
  }
}

export async function revokeIntegrationAction(formData: FormData) {
  try {
    const context = await requireDirector();
    const { id } = idSchema.parse(Object.fromEntries(formData));
    await getDatabase().update(schema.leadWebhookCredentials).set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.leadWebhookCredentials.id, id), eq(schema.leadWebhookCredentials.tenantId, context.tenantId)));
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível revogar a integração." };
  }
}

export async function deleteIntegrationAction(formData: FormData) {
  try {
    const context = await requireDirector();
    const { id } = idSchema.parse(Object.fromEntries(formData));
    const db = getDatabase();
    const [integration] = await db.select({ id: schema.leadWebhookCredentials.id }).from(schema.leadWebhookCredentials).where(and(eq(schema.leadWebhookCredentials.id, id), eq(schema.leadWebhookCredentials.tenantId, context.tenantId))).limit(1);
    if (!integration) return { success: false, error: "Fonte não encontrada." };
    await db.transaction(async (tx) => {
      await tx.delete(schema.leadWebhookCredentials).where(and(eq(schema.leadWebhookCredentials.id, id), eq(schema.leadWebhookCredentials.tenantId, context.tenantId)));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "lead_webhook_credential", entidadeId: id, acao: "lead_source.deleted" });
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível excluir a fonte." }; }
}

export async function createMarketingConnectionAction(formData: FormData) {
  try {
    const context = await requireDirector();
    const input = marketingConnectionSchema.parse(Object.fromEntries(formData));
    const db = getDatabase();
    const branchId = input.branchId || null;
    if (branchId) {
      const [branch] = await db.select({ id: schema.branches.id }).from(schema.branches).where(and(eq(schema.branches.id, branchId), eq(schema.branches.tenantId, context.tenantId), eq(schema.branches.status, "active"))).limit(1);
      if (!branch) return { success: false, error: "A unidade selecionada não pertence à corretora." };
    }
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(schema.marketingConnections).values({ id, tenantId: context.tenantId, branchId, provider: "meta", platform: input.platform, externalPageId: input.externalPageId, externalFormId: input.externalFormId || null, name: input.name, status: "active", createdBy: context.userId });
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: id, acao: "marketing_connection.created" });
    });
    revalidatePath("/settings");
    return { success: true, id };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível conectar a fonte Meta." }; }
}

export async function toggleMarketingConnectionAction(formData: FormData) {
  try {
    const context = await requireDirector(); const { id } = idSchema.parse(Object.fromEntries(formData)); const db = getDatabase();
    const [connection] = await db.select({ id: schema.marketingConnections.id, status: schema.marketingConnections.status }).from(schema.marketingConnections).where(and(eq(schema.marketingConnections.id, id), eq(schema.marketingConnections.tenantId, context.tenantId))).limit(1);
    if (!connection) return { success: false, error: "Conexão não encontrada." };
    const status = connection.status === "active" ? "inactive" : "active";
    await db.transaction(async (tx) => { await tx.update(schema.marketingConnections).set({ status, updatedAt: new Date() }).where(eq(schema.marketingConnections.id, id)); await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: id, acao: status === "active" ? "marketing_connection.activated" : "marketing_connection.deactivated" }); });
    revalidatePath("/settings"); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar a conexão." }; }
}

export async function deleteMarketingConnectionAction(formData: FormData) {
  try {
    const context = await requireDirector(); const { id } = idSchema.parse(Object.fromEntries(formData)); const db = getDatabase();
    const [connection] = await db.select({ id: schema.marketingConnections.id }).from(schema.marketingConnections).where(and(eq(schema.marketingConnections.id, id), eq(schema.marketingConnections.tenantId, context.tenantId))).limit(1);
    if (!connection) return { success: false, error: "Conexão não encontrada." };
    await db.transaction(async (tx) => { await tx.delete(schema.marketingConnections).where(and(eq(schema.marketingConnections.id, id), eq(schema.marketingConnections.tenantId, context.tenantId))); await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "marketing_connection", entidadeId: id, acao: "marketing_connection.deleted" }); });
    revalidatePath("/settings"); return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Não foi possível excluir a conexão." }; }
}
