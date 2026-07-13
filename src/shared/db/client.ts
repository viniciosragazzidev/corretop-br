import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let database: Database | undefined;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for database-backed operations. Add it to .env.local or the server environment.",
    );
  }
  return databaseUrl;
}

/** Infrastructure-only database entry point. Domain code must use tenantDb. */
export function getDatabase(): Database {
  database ??= drizzle(new Pool({ connectionString: getDatabaseUrl() }), { schema });
  return database;
}

export { schema };
