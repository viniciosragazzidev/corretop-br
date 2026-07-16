import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { requireCanCreateRole } from "@/shared/auth/team-permissions";
import { getDatabase, schema } from "@/shared/db";

const jobTitleInput = z.enum(schema.teamJobTitleValues);

const createUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(["manager", "broker"]),
  jobTitle: jobTitleInput,
  branchId: z.string().uuid(),
});

export async function createTeamUser(rawInput: unknown) {
  const input = createUserInput.parse(rawInput);
  const context = requireCanCreateRole(await getRequiredTenantContext(), input.role);
  if (context.role === "manager" && input.branchId !== context.branchId) {
    throw new Error("Gestores só podem criar acessos na própria unidade.");
  }

  const db = getDatabase();

  const [branch] = await db
    .select()
    .from(schema.branches)
    .where(
      and(
        eq(schema.branches.id, input.branchId),
        eq(schema.branches.tenantId, context.tenantId),
        eq(schema.branches.status, "active"),
      ),
    )
    .limit(1);
  if (!branch) throw new Error("A filial selecionada não pertence ao tenant ativo ou está inativa.");

  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, input.email))
    .limit(1);
  if (existing) throw new Error("Já existe uma identidade com este e-mail.");

  const userId = randomUUID();
  const membershipId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({
      id: userId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      active: true,
      status: "active",
    });
    await tx.insert(schema.account).values({
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: await hashPassword(input.password),
    });
    await tx.insert(schema.tenantMemberships).values({
      id: membershipId,
      tenantId: context.tenantId,
      userId,
      branchId: input.branchId,
      role: input.role,
      jobTitle: input.jobTitle,
      status: "active",
    });
    await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "tenant_membership", entidadeId: membershipId, acao: "criou_membro" });
  });
}
