import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to apply migrations.");
}
const connectionString = databaseUrl;

async function main() {
  const database = drizzle(neon(connectionString));
  await migrate(database, { migrationsFolder: "drizzle" });
  console.log("Database migrations are up to date.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
