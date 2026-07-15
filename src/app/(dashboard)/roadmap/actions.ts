"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

async function setSetting(key: string, value: string) {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.key, key));

  if (existing.length > 0) {
    await db
      .update(schema.systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.systemSettings.key, key));
  } else {
    await db
      .insert(schema.systemSettings)
      .values({ key, value, updatedAt: new Date() });
  }
}

export async function updateSystemSettingsAction(formData: FormData) {
  const context = await getRequiredTenantContext();
  const db = getDatabase();

  // Validate super-admin role
  const [dbUser] = await db
    .select({ isPlatformAdmin: schema.user.isPlatformAdmin })
    .from(schema.user)
    .where(eq(schema.user.id, context.userId));

  if (!dbUser?.isPlatformAdmin) {
    throw new Error("Apenas o super-admin pode alterar as configurações do sistema.");
  }

  const enabledStr = formData.get("centralAtencaoEnabled");
  const stagnantDaysStr = formData.get("stagnantDays");

  const enabled = enabledStr === "true" ? "true" : "false";
  const stagnantDays = parseInt(stagnantDaysStr as string, 10);
  const stagnantDaysVal = isNaN(stagnantDays) || stagnantDays < 1 ? "3" : stagnantDays.toString();

  await setSetting("feature_central_atencao_enabled", enabled);
  await setSetting("feature_central_atencao_stagnant_days", stagnantDaysVal);

  // Log in platform audit logs
  const logId = Math.random().toString(36).substring(2);
  await db.insert(schema.platformAuditLogs).values({
    id: logId,
    actorUserId: context.userId,
    action: "update_central_atencao_settings",
    targetType: "system_settings",
    targetId: "central_atencao",
    metadata: {
      enabled,
      stagnantDays: stagnantDaysVal,
    },
    createdAt: new Date(),
  });

  revalidatePath("/roadmap");
}
