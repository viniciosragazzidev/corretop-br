import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDatabase, schema } from "@/shared/db";

type DatabaseError = { code?: string; cause?: { code?: string } };

function isMissingSystemSettingsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const databaseError = error as DatabaseError;
  return databaseError.code === "42P01" || databaseError.cause?.code === "42P01";
}

export async function getSystemSettings(keys?: readonly string[]) {
  try {
    const db = getDatabase();
    return keys?.length
      ? await db
          .select({ key: schema.systemSettings.key, value: schema.systemSettings.value })
          .from(schema.systemSettings)
          .where(inArray(schema.systemSettings.key, [...keys]))
      : await db.select({ key: schema.systemSettings.key, value: schema.systemSettings.value }).from(schema.systemSettings);
  } catch (error) {
    if (isMissingSystemSettingsTable(error)) return [];
    throw error;
  }
}

export async function getSystemSetting(key: string) {
  const [setting] = await getSystemSettings([key]);
  return setting?.value;
}
