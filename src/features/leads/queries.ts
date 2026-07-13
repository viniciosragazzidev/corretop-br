import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { assertTenantAccess } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function getLeadTimeline(leadId: string) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  const [lead] = await db
    .select({
      id: schema.leads.id,
      tenantId: schema.leads.tenantId,
      corretorId: schema.leads.corretorId,
      branchId: schema.leads.branchId,
    })
    .from(schema.leads)
    .where(and(eq(schema.leads.id, leadId), eq(schema.leads.tenantId, context.tenantId)))
    .limit(1);

  if (!lead) return null;
  assertTenantAccess(context, lead.tenantId);

  if (context.role === "broker" && lead.corretorId !== context.userId) return null;
  if (context.role === "manager" && (!context.branchId || lead.branchId !== context.branchId)) return null;

  return db
    .select({
      id: schema.leadInteractions.id,
      tipo: schema.leadInteractions.tipo,
      conteudo: schema.leadInteractions.conteudo,
      metadata: schema.leadInteractions.metadata,
      userId: schema.leadInteractions.userId,
      createdAt: schema.leadInteractions.createdAt,
      userName: schema.user.name,
    })
    .from(schema.leadInteractions)
    .leftJoin(schema.user, eq(schema.leadInteractions.userId, schema.user.id))
    .where(eq(schema.leadInteractions.leadId, leadId))
    .orderBy(desc(schema.leadInteractions.createdAt));
}
