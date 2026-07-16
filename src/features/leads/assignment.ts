import "server-only";

import { and, asc, count, eq, inArray, not } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";

const activeStatuses = ["distributed", "in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis"] as const;

/**
 * Escolhe o corretor elegível com a menor carteira ativa (desempate por criação).
 * Retorna null se a filial não permitir distribuição automática (auto_distribute = false).
 */
export async function chooseAvailableBroker(tenantId: string, branchId: string | null, excludeBrokerId?: string | null) {
  if (!branchId) return null;
  const db = getDatabase();

  // Check if branch has auto-distribution enabled (manager toggle)
  const [branch] = await db
    .select({ autoDistribute: schema.branches.autoDistribute })
    .from(schema.branches)
    .where(and(eq(schema.branches.id, branchId), eq(schema.branches.tenantId, tenantId)))
    .limit(1);
  if (!branch || !branch.autoDistribute) return null;

  const brokers = await db
    .select({ id: schema.user.id, createdAt: schema.user.createdAt })
    .from(schema.user)
    .innerJoin(schema.tenantMemberships, eq(schema.tenantMemberships.userId, schema.user.id))
    .where(and(
      eq(schema.tenantMemberships.tenantId, tenantId),
      eq(schema.tenantMemberships.branchId, branchId),
      eq(schema.tenantMemberships.role, "broker"),
      eq(schema.tenantMemberships.status, "active"),
      eq(schema.tenantMemberships.availabilityStatus, "available"),
      eq(schema.user.active, true),
      eq(schema.user.status, "active"),
      ...(excludeBrokerId ? [not(eq(schema.user.id, excludeBrokerId))] : []),
    ))
    .orderBy(asc(schema.user.createdAt));

  if (!brokers.length) return null;
  const ids = brokers.map((broker) => broker.id);
  const workloads = await db
    .select({ brokerId: schema.leads.corretorId, total: count(schema.leads.id) })
    .from(schema.leads)
    .where(and(eq(schema.leads.tenantId, tenantId), inArray(schema.leads.corretorId, ids), inArray(schema.leads.status, activeStatuses)))
    .groupBy(schema.leads.corretorId);
  const loadByBroker = new Map(workloads.map((item) => [item.brokerId, Number(item.total)]));
  return [...brokers].sort((a, b) => (loadByBroker.get(a.id) ?? 0) - (loadByBroker.get(b.id) ?? 0))[0]?.id ?? null;
}
