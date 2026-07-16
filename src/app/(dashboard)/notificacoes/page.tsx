import { desc, and, eq } from "drizzle-orm";

import { DashboardHeader } from "@/components/dashboard-header";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const context = await getRequiredTenantContext();
  const notifications = await getDatabase()
    .select({
      id: schema.notifications.id,
      title: schema.notifications.title,
      message: schema.notifications.message,
      type: schema.notifications.type,
      readAt: schema.notifications.readAt,
      createdAt: schema.notifications.createdAt,
      leadId: schema.notifications.leadId,
    })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.tenantId, context.tenantId),
        eq(schema.notifications.recipientUserId, context.userId),
      )
    )
    .orderBy(desc(schema.notifications.createdAt))
    .limit(100);

  const serializedNotifications = notifications.map((notification) => ({
    ...notification,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }));

  return (
    <>
      <DashboardHeader breadcrumb="Centro de notificações" title="Notificações" />
      <NotificationsClient notifications={serializedNotifications} />
    </>
  );
}
