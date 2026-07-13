"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function toggleBrokerAvailabilityAction() {
  const context = await getRequiredTenantContext();
  if (context.role !== "broker") throw new Error("Apenas corretores podem alterar a própria disponibilidade.");
  const db = getDatabase();
  const [membership] = await db.select({ id: schema.tenantMemberships.id, availabilityStatus: schema.tenantMemberships.availabilityStatus })
    .from(schema.tenantMemberships).where(eq(schema.tenantMemberships.userId, context.userId)).limit(1);
  if (!membership) throw new Error("Vínculo operacional não encontrado.");
  await db.update(schema.tenantMemberships).set({ availabilityStatus: membership.availabilityStatus === "available" ? "paused" : "available", updatedAt: new Date() }).where(eq(schema.tenantMemberships.id, membership.id));
  revalidatePath("/dashboard");
}
