"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPlatformTenant,
  createTenantAccess,
  setPlatformTenantStatus,
  terminateSession,
  purgeUserLGPD,
  getPlatformAuditLogs,
  getTenantAuditLogs,
} from "@/features/platform-admin/service";
import { getDatabase, schema } from "@/shared/db";
import { eq, and } from "drizzle-orm";
import { runSlaSweep } from "@/features/leads/sla";
import { sql } from "drizzle-orm";
import { getRequiredPlatformAdmin } from "@/shared/auth/platform-admin";

export async function createTenantAction(formData: FormData) {
  const tenantId = await createPlatformTenant(Object.fromEntries(formData));
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/tenants");
  redirect(`/super-admin/tenants/${tenantId}`);
}

export async function setTenantStatusAction(formData: FormData) {
  const tenantId = String(formData.get("tenantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "active" && status !== "inactive") throw new Error("Status inválido.");
  await setPlatformTenantStatus(tenantId, status);
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/tenants");
  revalidatePath(`/super-admin/tenants/${tenantId}`);
}

export async function createTenantAccessAction(formData: FormData) {
  await createTenantAccess(Object.fromEntries(formData));
  const tenantId = String(formData.get("tenantId") ?? "");
  revalidatePath(`/super-admin/tenants/${tenantId}`);
}

export async function terminateSessionAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  await terminateSession(sessionId);
  revalidatePath("/super-admin/sessions");
}

export async function purgeUserLGPDAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  await purgeUserLGPD(userId);
  revalidatePath("/super-admin/audit");
}

export async function getLeadEvidenceReportAction(leadId: string) {
  await getRequiredPlatformAdmin();
  const db = getDatabase();

  const [lead] = await db.select({
    id: schema.leads.id,
    nome: schema.leads.nome,
    telefone: schema.leads.telefone,
    email: schema.leads.email,
    status: schema.leads.status,
    origem: schema.leads.origem,
    createdAt: schema.leads.createdAt,
  }).from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);

  if (!lead) return { error: "Lead não encontrado." };

  const timeline = await db.select({
    id: schema.leadInteractions.id,
    type: schema.leadInteractions.tipo,
    content: schema.leadInteractions.conteudo,
    createdAt: schema.leadInteractions.createdAt,
  }).from(schema.leadInteractions)
    .where(eq(schema.leadInteractions.leadId, leadId))
    .orderBy(schema.leadInteractions.createdAt);

  const documents = await db.select({
    id: schema.leadDocuments.id,
    fileName: schema.leadDocuments.filename,
    status: schema.leadDocuments.status,
    createdAt: schema.leadDocuments.createdAt,
  }).from(schema.leadDocuments)
    .where(eq(schema.leadDocuments.leadId, leadId))
    .orderBy(schema.leadDocuments.createdAt);

  return {
    success: true,
    report: {
      lead,
      timeline,
      documents,
      exportedAt: new Date().toISOString(),
    },
  };
}

export async function getPlatformAuditLogsAction() {
  return getPlatformAuditLogs();
}

export async function getTenantAuditLogsAction() {
  return getTenantAuditLogs();
}

// DEV TOOLS SERVER ACTIONS
export async function runDbQueryAction(tableName: string, limit: number = 20) {
  await getRequiredPlatformAdmin();
  const db = getDatabase();

  try {
    let result: any[] = [];
    switch (tableName) {
      case "tenants":
        result = await db.select().from(schema.tenants).limit(limit);
        break;
      case "user":
        result = await db.select().from(schema.user).limit(limit);
        break;
      case "leads":
        result = await db.select().from(schema.leads).limit(limit);
        break;
      case "auditLogs":
        result = await db.select().from(schema.auditLogs).limit(limit);
        break;
      case "platformAuditLogs":
        result = await db.select().from(schema.platformAuditLogs).limit(limit);
        break;
      case "session":
        result = await db.select().from(schema.session).limit(limit);
        break;
      case "leadInteractions":
        result = await db.select().from(schema.leadInteractions).limit(limit);
        break;
      case "leadDocuments":
        result = await db.select().from(schema.leadDocuments).limit(limit);
        break;
      default:
        throw new Error("Tabela desconhecida ou restrita.");
    }
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido ao executar query." };
  }
}

export async function triggerSlaCronAction() {
  await getRequiredPlatformAdmin();
  try {
    const result = await runSlaSweep();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido no SLA cron." };
  }
}

export async function getSystemMetricsAction() {
  await getRequiredPlatformAdmin();
  const db = getDatabase();
  try {
    const dbSizeResult = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
    const connectionsResult = await db.execute(sql`SELECT count(*) as active_connections FROM pg_stat_activity`);
    
    return {
      success: true,
      dbSize: String((dbSizeResult as any)[0]?.size || "N/A"),
      activeConnections: Number((connectionsResult as any)[0]?.active_connections || 0),
      env: process.env.NODE_ENV,
      authProvider: "BetterAuth (Local & Postgres Store)",
      neonStatus: "Operacional (Conectado via neon-serverless)"
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao coletar métricas." };
  }
}
