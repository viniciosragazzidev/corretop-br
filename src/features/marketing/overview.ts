import "server-only";

import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { requireCentralMetaLeadAdsManager } from "@/shared/auth/authorization";
import { getDatabase, schema } from "@/shared/db";

export async function getMarketingOverview() {
  const context = requireCentralMetaLeadAdsManager(await getRequiredTenantContext());
  const db = getDatabase();
  const [total, open, converted, lost, sources, connections] = await Promise.all([
    db.select({ value: count() }).from(schema.leads).where(eq(schema.leads.tenantId, context.tenantId)),
    db.select({ value: count() }).from(schema.leads).where(and(eq(schema.leads.tenantId, context.tenantId), sql`${schema.leads.status} not in ('converted', 'lost')`)),
    db.select({ value: count() }).from(schema.leads).where(and(eq(schema.leads.tenantId, context.tenantId), eq(schema.leads.status, "converted"))),
    db.select({ value: count() }).from(schema.leads).where(and(eq(schema.leads.tenantId, context.tenantId), eq(schema.leads.status, "lost"))),
    db.select({ channel: schema.leads.sourceChannel, total: count() }).from(schema.leads).where(eq(schema.leads.tenantId, context.tenantId)).groupBy(schema.leads.sourceChannel).orderBy(desc(count())).limit(8),
    db.select({ id: schema.marketingConnections.id, name: schema.marketingConnections.name, platform: schema.marketingConnections.platform, externalFormId: schema.marketingConnections.externalFormId, status: schema.marketingConnections.status, lastWebhookAt: schema.marketingConnections.lastWebhookAt, lastError: schema.marketingConnections.lastError }).from(schema.marketingConnections).where(and(eq(schema.marketingConnections.tenantId, context.tenantId), isNull(schema.marketingConnections.branchId))).orderBy(desc(schema.marketingConnections.updatedAt)),
  ]);
  return {
    scope: "matriz" as const,
    totals: { all: Number(total[0]?.value ?? 0), open: Number(open[0]?.value ?? 0), converted: Number(converted[0]?.value ?? 0), lost: Number(lost[0]?.value ?? 0) },
    sources: sources.map((row) => ({ channel: row.channel, total: Number(row.total) })),
    connections,
  };
}
