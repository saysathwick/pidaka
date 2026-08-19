import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export const isDemoMode = !process.env.DATABASE_URL;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL || "";
const useSsl =
  process.env.NODE_ENV === "production" ||
  /[?&]sslmode=/.test(connectionString);

export const pool = isDemoMode
  ? null
  : new Pool({
      connectionString,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

export const db = isDemoMode
  ? (null as unknown as ReturnType<typeof drizzle>)
  : drizzle(pool!, { schema });
