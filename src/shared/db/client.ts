import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzlePostgres<typeof schema>>;

let database: Database | undefined;
let runtimeSchemaPromise: Promise<void> | undefined;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for database-backed operations. Add it to .env.local or the server environment.",
    );
  }
  return databaseUrl;
}

/** Infrastructure-only database entry point. Domain code must use tenantDb. */
export function getDatabase(): Database {
  const supabaseUrl = process.env.SUPABASE_DB_URL;
  if (supabaseUrl) {
    database ??= drizzlePostgres(postgres(supabaseUrl, {
      prepare: false,
      max: 5,
      connect_timeout: 15,
      idle_timeout: 20,
    }), { schema });
  } else {
    database ??= drizzle(new Pool({ connectionString: getDatabaseUrl() }), { schema }) as unknown as Database;
  }
  return database;
}

export async function ensureRuntimeSchema() {
  runtimeSchemaPromise ??= (async () => {
    const db = getDatabase();
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "accepting_leads" boolean NOT NULL DEFAULT true`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "auto_distribute" boolean NOT NULL DEFAULT true`);
    await db.execute(sql`ALTER TABLE "tenant_memberships" ADD COLUMN IF NOT EXISTS "job_title" text NOT NULL DEFAULT 'broker'`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    try {
      await db.execute(sql`ALTER PUBLICATION supabase_realtime ADD TABLE leads`);
      await db.execute(sql`ALTER TABLE leads REPLICA IDENTITY FULL`);
    } catch {
      // Fail silently if not running on Supabase or table is already added
    }
  })().catch((error) => {
    runtimeSchemaPromise = undefined;
    throw error;
  });

  await runtimeSchemaPromise;
}

export { schema };
