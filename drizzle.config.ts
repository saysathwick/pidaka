import { defineConfig } from "drizzle-kit";
import { databaseUsesSsl, normalizeDatabaseUrl } from "./shared/pg-ssl";

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const useSsl = databaseUsesSsl(databaseUrl);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  },
});
