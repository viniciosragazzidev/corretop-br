"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/shared/auth/authorization";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export type BranchActionState = { success?: boolean; error?: string };

const branchInput = z.object({
  name: z.string().trim().min(2, "Informe um nome de filial válido.").max(100),
  externalId: z.string().trim().max(80).optional(),
});

const branchIdInput = z.string().trim().min(1, "Filial inválida.");

async function getDirectorContext() {
  const context = await getRequiredTenantContext();
  requireRole(context, "director");
  return context;
}

function actionError(error: unknown): BranchActionState {
  if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
    return { error: "Já existe uma filial com esse identificador." };
  }
  return { error: error instanceof Error ? error.message : "Não foi possível concluir a operação." };
}

export async function createBranchAction(
  _previous: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const parsed = branchInput.safeParse({
    name: formData.get("name"),
    externalId: formData.get("externalId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getDirectorContext();
    await getDatabase().insert(schema.branches).values({
      id: randomUUID(),
      tenantId: context.tenantId,
      name: parsed.data.name,
      status: "active",
    });
    revalidatePath("/filiais");
    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBranchAction(
  _previous: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const branchId = branchIdInput.safeParse(formData.get("branchId"));
  const parsed = branchInput.safeParse({
    name: formData.get("name"),
    externalId: formData.get("externalId") || undefined,
  });
  if (!branchId.success) return { error: branchId.error.issues[0]?.message ?? "Filial inválida." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  try {
    const context = await getDirectorContext();
    const result = await getDatabase()
      .update(schema.branches)
      .set({ name: parsed.data.name })
      .where(and(eq(schema.branches.id, branchId.data), eq(schema.branches.tenantId, context.tenantId)))
      .returning({ id: schema.branches.id });
    if (result.length === 0) return { error: "Filial não encontrada." };
    revalidatePath("/filiais");
    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleBranchAction(
  _previous: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const branchId = branchIdInput.safeParse(formData.get("branchId"));
  if (!branchId.success) return { error: branchId.error.issues[0]?.message ?? "Filial inválida." };

  try {
    const context = await getDirectorContext();
    const [branch] = await getDatabase()
      .select({ id: schema.branches.id, status: schema.branches.status })
      .from(schema.branches)
      .where(and(eq(schema.branches.id, branchId.data), eq(schema.branches.tenantId, context.tenantId)))
      .limit(1);
    if (!branch) return { error: "Filial não encontrada." };
    await getDatabase()
      .update(schema.branches)
      .set({ status: branch.status === "active" ? "inactive" : "active" })
      .where(eq(schema.branches.id, branch.id));
    revalidatePath("/filiais");
    revalidatePath("/equipe");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
