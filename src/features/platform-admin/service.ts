import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getRequiredPlatformAdmin } from "@/shared/auth/platform-admin";
import { getDatabase, schema } from "@/shared/db";

const cnpjPattern = /^\d{14}$/;

const tenantInput = z.object({
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().min(2).max(160),
  cnpj: z.string().trim().transform((value) => value.replace(/\D/g, "")).refine((value) => cnpjPattern.test(value), "CNPJ deve conter 14 dígitos."),
  subscriptionPlan: z.string().trim().min(2).max(60),
});

const accessInput = z.object({
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(["director", "manager", "broker"]),
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function writeAudit(action: string, targetType: string, targetId: string, metadata?: Record<string, string>) {
  const admin = await getRequiredPlatformAdmin();
  await getDatabase().insert(schema.platformAuditLogs).values({
    id: randomUUID(), actorUserId: admin.userId, action, targetType, targetId, metadata,
  });
}

export async function getPlatformTenants() {
  await getRequiredPlatformAdmin();
  return getDatabase().select().from(schema.tenants).orderBy(schema.tenants.createdAt);
}

export async function getPlatformTenant(tenantId: string) {
  await getRequiredPlatformAdmin();
  const [tenant] = await getDatabase().select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
  return tenant ?? null;
}

export async function getTenantMembers(tenantId: string) {
  await getRequiredPlatformAdmin();
  return getDatabase().select({
    id: schema.tenantMemberships.id,
    name: schema.user.name,
    email: schema.user.email,
    role: schema.tenantMemberships.role,
    status: schema.tenantMemberships.status,
    branchName: schema.branches.name,
  }).from(schema.tenantMemberships)
    .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
    .leftJoin(schema.branches, eq(schema.tenantMemberships.branchId, schema.branches.id))
    .where(eq(schema.tenantMemberships.tenantId, tenantId));
}

export async function getTenantBranches(tenantId: string) {
  await getRequiredPlatformAdmin();
  return getDatabase().select().from(schema.branches).where(eq(schema.branches.tenantId, tenantId));
}

export async function createPlatformTenant(rawInput: unknown) {
  const input = tenantInput.parse(rawInput);
  await getRequiredPlatformAdmin();
  const db = getDatabase();
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let suffix = 2;
  while ((await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.slug, slug)).limit(1)).length) slug = `${baseSlug}-${suffix++}`;
  const tenantId = randomUUID();
  const branchId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(schema.tenants).values({ id: tenantId, name: input.name, slug, legalName: input.legalName, cnpj: input.cnpj, subscriptionPlan: input.subscriptionPlan, status: "active" });
    await tx.insert(schema.branches).values({ id: branchId, tenantId, name: "Matriz", status: "active" });
  });
  await writeAudit("tenant.created", "tenant", tenantId, { slug });
  return tenantId;
}

export async function setPlatformTenantStatus(tenantId: string, status: "active" | "inactive") {
  await getRequiredPlatformAdmin();
  await getDatabase().update(schema.tenants).set({ status, updatedAt: new Date() }).where(eq(schema.tenants.id, tenantId));
  await writeAudit("tenant.status_changed", "tenant", tenantId, { status });
}

export async function createTenantAccess(rawInput: unknown) {
  const input = accessInput.parse(rawInput);
  await getRequiredPlatformAdmin();
  const db = getDatabase();
  const [branch] = await db.select().from(schema.branches).where(and(eq(schema.branches.id, input.branchId), eq(schema.branches.tenantId, input.tenantId))).limit(1);
  if (!branch) throw new Error("A filial selecionada não pertence a esta corretora.");
  const [existingUser] = await db.select().from(schema.user).where(eq(schema.user.email, input.email)).limit(1);
  if (existingUser) throw new Error("Já existe uma identidade com este e-mail.");
  const userId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({ id: userId, name: input.name, email: input.email, emailVerified: true, active: true });
    await tx.insert(schema.account).values({ id: randomUUID(), userId, providerId: "credential", accountId: userId, password: await hashPassword(input.password) });
    await tx.insert(schema.tenantMemberships).values({ id: randomUUID(), tenantId: input.tenantId, userId, branchId: input.branchId, role: input.role, status: "active" });
  });
  await writeAudit("tenant_access.created", "tenant_membership", userId, { tenantId: input.tenantId, role: input.role });
}
