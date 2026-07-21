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

/**
 * Supabase exposes standard PostgreSQL URLs, often through a pooler hostname.
 * The provider must be inferred from the URL rather than from the environment
 * variable name: production uses DATABASE_URL while local development uses
 * SUPABASE_DB_URL.
 */
export function usesPostgresJsDriver(databaseUrl: string): boolean {
  try {
    const hostname = new URL(databaseUrl).hostname.toLowerCase();
    return hostname.endsWith(".supabase.com");
  } catch {
    return false;
  }
}

function createPostgresDatabase(databaseUrl: string): Database {
  return drizzlePostgres(postgres(databaseUrl, {
    prepare: false,
    max: 5,
    connect_timeout: 15,
    idle_timeout: 20,
  }), { schema });
}

/** Infrastructure-only database entry point. Domain code must use tenantDb. */
export function getDatabase(): Database {
  const databaseUrl = getDatabaseUrl();
  if (usesPostgresJsDriver(databaseUrl)) {
    database ??= createPostgresDatabase(databaseUrl);
  } else {
    database ??= drizzle(new Pool({ connectionString: databaseUrl }), { schema }) as unknown as Database;
  }
  return database;
}

export async function ensureRuntimeSchema() {
  runtimeSchemaPromise ??= (async () => {
    const db = getDatabase();
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "accepting_leads" boolean NOT NULL DEFAULT true`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "auto_distribute" boolean NOT NULL DEFAULT true`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "source_channel" text NOT NULL DEFAULT 'landing_page'`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "source_campaign" text`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "source_ad" text`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "source_form" text`);
    await db.execute(sql`ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "source_metadata" jsonb`);
    await db.execute(sql`ALTER TABLE "tenant_memberships" ADD COLUMN IF NOT EXISTS "job_title" text NOT NULL DEFAULT 'broker'`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    const tables = ["leads", "notifications"] as const;
    for (const table of tables) {
      try {
        await db.execute(sql`ALTER PUBLICATION supabase_realtime ADD TABLE ${sql.identifier(table)}`);
      } catch {
        // Já adicionada ou não estamos no Supabase — falha silenciosa
      }
    }
    try {
      await db.execute(sql`ALTER TABLE leads REPLICA IDENTITY FULL`);
    } catch {
      // Falha silenciosa
    }
    // Marketing Import tables
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "marketing_imports" (
      "id" text PRIMARY KEY NOT NULL,
      "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" text NOT NULL REFERENCES "user"("id"),
      "branch_id" text REFERENCES "branches"("id") ON DELETE SET NULL,
      "file_name" text NOT NULL,
      "file_hash" text NOT NULL,
      "file_size" integer NOT NULL DEFAULT 0,
      "import_type" text NOT NULL DEFAULT 'pf',
      "status" text NOT NULL DEFAULT 'uploading',
      "total_rows" integer NOT NULL DEFAULT 0,
      "imported_count" integer NOT NULL DEFAULT 0,
      "duplicate_count" integer NOT NULL DEFAULT 0,
      "invalid_count" integer NOT NULL DEFAULT 0,
      "duration_ms" integer,
      "error_message" text,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "marketing_import_results" (
      "id" text PRIMARY KEY NOT NULL,
      "import_id" text NOT NULL REFERENCES "marketing_imports"("id") ON DELETE CASCADE,
      "lead_id" text REFERENCES "leads"("id") ON DELETE SET NULL,
      "row_index" integer NOT NULL,
      "status" text NOT NULL DEFAULT 'created',
      "message" text,
      "external_lead_id" text,
      "nome" text NOT NULL,
      "telefone" text NOT NULL,
      "email" text,
      "created_at" timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "captured_at" timestamptz`);
  })().catch((error) => {
    runtimeSchemaPromise = undefined;
    throw error;
  });

  await runtimeSchemaPromise;
}

export { schema };
