"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";

import { createTeamUser } from "@/features/team/create-user";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { requireCanCreateRole, requireCanManageMember } from "@/shared/auth/team-permissions";
import { getDatabase, schema } from "@/shared/db";

export type TeamActionState = { success?: boolean; error?: string };

const memberRole = z.enum(["manager", "broker"]);
const memberJobTitle = z.enum(schema.teamJobTitleValues);

const updateMemberInput = z.object({
  memberId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: memberRole,
  jobTitle: memberJobTitle,
  branchId: z.string().uuid(),
});

const memberIdInput = z.object({
  memberId: z.string().uuid(),
});

export async function createTeamUserAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    await createTeamUser(Object.fromEntries(formData));
    revalidatePath("/equipe");
    return { success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erro desconhecido ao criar acesso.";
    return { success: false, error: message };
  }
}

export async function updateTeamMemberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const input = updateMemberInput.parse(Object.fromEntries(formData));
    const context = await getRequiredTenantContext();
    const db = getDatabase();

    const [member] = await db
      .select({
        membershipId: schema.tenantMemberships.id,
        userId: schema.user.id,
        role: schema.tenantMemberships.role,
        jobTitle: schema.tenantMemberships.jobTitle,
        branchId: schema.tenantMemberships.branchId,
        status: schema.user.status,
      })
      .from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .where(
        and(
          eq(schema.tenantMemberships.id, input.memberId),
          eq(schema.tenantMemberships.tenantId, context.tenantId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new Error("Membro nao encontrado.");
    }

    requireCanManageMember(context, {
      role: member.role,
      branchId: member.branchId,
      userId: member.userId,
    });

    if (context.role === "manager" && context.branchId && input.branchId !== context.branchId) {
      throw new Error("Gestores so podem manter corretores na propria filial.");
    }

    requireCanCreateRole(context, input.role);

    const [branch] = await db
      .select({ id: schema.branches.id })
      .from(schema.branches)
      .where(
        and(
          eq(schema.branches.id, input.branchId),
          eq(schema.branches.tenantId, context.tenantId),
          eq(schema.branches.status, "active"),
        ),
      )
      .limit(1);

    if (!branch) {
      throw new Error("A filial selecionada nao pertence ao tenant ativo ou esta inativa.");
    }

    const [emailOwner] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(and(eq(schema.user.email, input.email), ne(schema.user.id, member.userId)))
      .limit(1);

    if (emailOwner) {
      throw new Error("Ja existe uma identidade com este e-mail.");
    }

    await db.transaction(async (tx) => {
      await tx.update(schema.user).set({
        name: input.name,
        email: input.email,
        updatedAt: new Date(),
      }).where(eq(schema.user.id, member.userId));

      await tx.update(schema.tenantMemberships).set({
        role: input.role,
        jobTitle: input.jobTitle,
        branchId: input.branchId,
        updatedAt: new Date(),
      }).where(eq(schema.tenantMemberships.id, member.membershipId));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "tenant_membership", entidadeId: member.membershipId, acao: "atualizou_membro" });
    });

    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao atualizar o membro.";
    return { success: false, error: message };
  }
}

export async function toggleTeamMemberStatusAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const { memberId } = memberIdInput.parse(Object.fromEntries(formData));
    const context = await getRequiredTenantContext();
    const db = getDatabase();

    const [member] = await db
      .select({
        membershipId: schema.tenantMemberships.id,
        userId: schema.user.id,
        role: schema.tenantMemberships.role,
        branchId: schema.tenantMemberships.branchId,
        status: schema.user.status,
      })
      .from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .where(
        and(
          eq(schema.tenantMemberships.id, memberId),
          eq(schema.tenantMemberships.tenantId, context.tenantId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new Error("Membro nao encontrado.");
    }

    requireCanManageMember(context, {
      role: member.role,
      branchId: member.branchId,
      userId: member.userId,
    });

    const nextActive = member.status !== "active";

    await db.transaction(async (tx) => {
      await tx.update(schema.user).set({
        active: nextActive,
        status: nextActive ? "active" : "disabled",
        updatedAt: new Date(),
      }).where(eq(schema.user.id, member.userId));

      await tx.update(schema.tenantMemberships).set({
        status: nextActive ? "active" : "inactive",
        updatedAt: new Date(),
      }).where(eq(schema.tenantMemberships.id, member.membershipId));
      await tx.insert(schema.auditLogs).values({ id: randomUUID(), userId: context.userId, entidade: "tenant_membership", entidadeId: member.membershipId, acao: nextActive ? "reativou_membro" : "desativou_membro" });
    });

    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao atualizar o status.";
    return { success: false, error: message };
  }
}

export async function deleteTeamMemberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const { memberId } = memberIdInput.parse(Object.fromEntries(formData));
    const context = await getRequiredTenantContext();
    const db = getDatabase();

    const [member] = await db
      .select({
        membershipId: schema.tenantMemberships.id,
        userId: schema.user.id,
        role: schema.tenantMemberships.role,
        branchId: schema.tenantMemberships.branchId,
      })
      .from(schema.tenantMemberships)
      .innerJoin(schema.user, eq(schema.tenantMemberships.userId, schema.user.id))
      .where(
        and(
          eq(schema.tenantMemberships.id, memberId),
          eq(schema.tenantMemberships.tenantId, context.tenantId),
        ),
      )
      .limit(1);

    if (!member) {
      throw new Error("Membro nao encontrado.");
    }

    requireCanManageMember(context, {
      role: member.role,
      branchId: member.branchId,
      userId: member.userId,
    });

    await db.transaction(async (tx) => {
      await tx.delete(schema.tenantMemberships).where(eq(schema.tenantMemberships.id, member.membershipId));
      await tx.delete(schema.user).where(eq(schema.user.id, member.userId));
    });

    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao excluir o membro.";
    return { success: false, error: message };
  }
}

const transferLeadsInput = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

export async function transferLeadsAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const input = transferLeadsInput.parse(Object.fromEntries(formData));
    const context = await getRequiredTenantContext();
    const db = getDatabase();

    const members = await db
      .select({ userId: schema.tenantMemberships.userId })
      .from(schema.tenantMemberships)
      .where(
        and(
          eq(schema.tenantMemberships.tenantId, context.tenantId),
          inArray(schema.tenantMemberships.userId, [input.fromUserId, input.toUserId])
        )
      );

    if (members.length < 2) {
      throw new Error("Os usuários de origem e destino devem pertencer ao mesmo tenant.");
    }

    await db
      .update(schema.leads)
      .set({ corretorId: input.toUserId, assignedAt: new Date() })
      .where(
        and(
          eq(schema.leads.tenantId, context.tenantId),
          eq(schema.leads.corretorId, input.fromUserId)
        )
      );

    revalidatePath("/equipe");
    revalidatePath("/leads");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido ao transferir leads.";
    return { success: false, error: message };
  }
}
