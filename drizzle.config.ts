import { defineConfig } from "drizzle-kit";
import { databaseUsesSsl } from "./shared/pg-ssl";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const useSsl = databaseUsesSsl(process.env.DATABASE_URL);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  },
});
