import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzlePostgres<typeof schema>>;

let database: Database | undefined;

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
    database ??= drizzlePostgres(postgres(supabaseUrl, { prepare: false }), { schema });
  } else {
    database ??= drizzle(new Pool({ connectionString: getDatabaseUrl() }), { schema }) as unknown as Database;
  }
  return database;
}

export { schema };
