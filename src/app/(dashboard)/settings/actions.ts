"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function updateTenantBrandingAction(
  _prev: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getRequiredTenantContext();
    if (context.role !== "director") {
      return { success: false, error: "Apenas diretores podem alterar a identidade visual." };
    }

    const brandColor = String(formData.get("brandColor") ?? "").trim() || null;
    const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

    if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
      return { success: false, error: "Cor inválida. Use o formato #RRGGBB." };
    }

    await getDatabase()
      .update(schema.tenants)
      .set({ brandColor, logoUrl, updatedAt: new Date() })
      .where(eq(schema.tenants.id, context.tenantId));

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao salvar identidade visual.";
    return { success: false, error: message };
  }
}
