import { randomBytes, createHash, randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { schema } from "@/shared/db";

/**
 * Generates the next internal code for a broker inside a specific tenant.
 * Uses a FOR UPDATE lock on the tenant's row to serialize concurrent additions.
 */
export async function generateNextInternalCode(tx: any, tenantId: string): Promise<string> {
  // Lock the tenant row to serialize additions for this tenant
  await tx
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1)
    .for("update");

  const [lastBroker] = await tx
    .select({ internalCode: schema.brokerProfiles.internalCode })
    .from(schema.brokerProfiles)
    .where(eq(schema.brokerProfiles.tenantId, tenantId))
    .orderBy(desc(schema.brokerProfiles.createdAt))
    .limit(1);

  let nextNum = 1;
  if (lastBroker?.internalCode) {
    const match = lastBroker.internalCode.match(/\d+/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }
  return `COR-${String(nextNum).padStart(6, "0")}`;
}

/**
 * Generates a cryptographically secure token, hashes it, invalidates previous invitations,
 * and saves the new invitation details to the database.
 */
export async function createBrokerInvitation(
  tx: any,
  tenantId: string,
  branchId: string,
  brokerProfileId: string,
  email: string
) {
  // Set all previous invitations for this broker to REPLACED
  await tx
    .update(schema.brokerInvitations)
    .set({ status: "REPLACED", revokedAt: new Date() })
    .where(
      and(
        eq(schema.brokerInvitations.brokerProfileId, brokerProfileId),
        eq(schema.brokerInvitations.status, "PENDING")
      )
    );

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  const id = randomUUID();
  await tx.insert(schema.brokerInvitations).values({
    id,
    tenantId,
    branchId,
    brokerProfileId,
    email,
    tokenHash,
    status: "PENDING",
    expiresAt,
    createdAt: new Date(),
  });

  return { token, expiresAt };
}
