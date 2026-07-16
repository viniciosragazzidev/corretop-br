import { NextResponse } from "next/server";
import { and, eq, isNull, count } from "drizzle-orm";
import { getRequiredTenantContext } from "@/shared/auth/tenant-context";
import { getDatabase, schema } from "@/shared/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getRequiredTenantContext();
    const [result] = await getDatabase()
      .select({ count: count() })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.tenantId, context.tenantId),
          eq(schema.notifications.recipientUserId, context.userId),
          isNull(schema.notifications.readAt),
        ),
      );
    return NextResponse.json({ count: result?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
