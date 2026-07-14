"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export async function markNotificationReadAction(formData: FormData) {
  const id = formData.get("notificationId");
  if (typeof id !== "string" || !id) return;

  const context = await getRequiredTenantContext();
  await getDatabase()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(schema.notifications.id, id),
      eq(schema.notifications.tenantId, context.tenantId),
      eq(schema.notifications.recipientUserId, context.userId),
      isNull(schema.notifications.readAt),
    ));

  revalidatePath("/notificacoes");
}

export async function markAllNotificationsReadAction() {
  const context = await getRequiredTenantContext();
  await getDatabase()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(schema.notifications.tenantId, context.tenantId),
      eq(schema.notifications.recipientUserId, context.userId),
      isNull(schema.notifications.readAt),
    ));

  revalidatePath("/notificacoes");
}
