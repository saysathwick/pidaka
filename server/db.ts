import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { databaseUsesSsl } from "@shared/pg-ssl";

const { Pool } = pg;

export const isDemoMode = !process.env.DATABASE_URL;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL || "";
const useSsl = Boolean(connectionString) && databaseUsesSsl(connectionString);

export const pool = isDemoMode
  ? null
  : new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

if (pool) {
  console.log(`[postgres] ssl=${useSsl}`);
  pool.on("error", (err) => {
    console.error("[postgres] pool error", err);
  });
}

export const db = isDemoMode
  ? (null as unknown as ReturnType<typeof drizzle>)
  : drizzle(pool!, { schema });
