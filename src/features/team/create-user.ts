import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { requireCanCreateRole } from "@/shared/auth/team-permissions";
import { getDatabase, schema } from "@/shared/db";
import { generateNextInternalCode, createBrokerInvitation } from "./onboarding-helpers";

const createUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(8).max(30),
  cpf: z.string().trim().min(11).max(20),
  role: z.enum(["manager", "broker"]),
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

  const [existingEmail] = await db
    .select({ id: schema.brokerProfiles.id })
    .from(schema.brokerProfiles)
    .where(and(eq(schema.brokerProfiles.invitedEmail, input.email), eq(schema.brokerProfiles.tenantId, context.tenantId)))
    .limit(1);
  if (existingEmail) throw new Error("Já existe um corretor com este e-mail.");

  const [existingCpf] = await db
    .select({ id: schema.brokerProfiles.id })
    .from(schema.brokerProfiles)
    .where(and(eq(schema.brokerProfiles.cpf, input.cpf), eq(schema.brokerProfiles.tenantId, context.tenantId)))
    .limit(1);
  if (existingCpf) throw new Error("Já existe um corretor com este CPF.");

  const [existingUser] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, input.email))
    .limit(1);
  if (existingUser) throw new Error("Já existe uma identidade com este e-mail.");

  const brokerProfileId = randomUUID();
  let inviteToken = "";

  await db.transaction(async (tx) => {
    const internalCode = await generateNextInternalCode(tx, context.tenantId);

    await tx.insert(schema.brokerProfiles).values({
      id: brokerProfileId,
      tenantId: context.tenantId,
      branchId: input.branchId,
      userId: null,
      internalCode,
      professionalName: input.name,
      phone: input.phone,
      invitedEmail: input.email,
      cpf: input.cpf,
      lifecycleStatus: "INVITED",
      managerId: context.userId,
      invitedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { token } = await createBrokerInvitation(tx, context.tenantId, input.branchId, brokerProfileId, input.email);
    inviteToken = token;

    await tx.insert(schema.auditLogs).values({
      id: randomUUID(),
      userId: context.userId,
      entidade: "broker_profile",
      entidadeId: brokerProfileId,
      acao: "criou_corretor_onboarding",
    });
  });

  return { token: inviteToken };
}
