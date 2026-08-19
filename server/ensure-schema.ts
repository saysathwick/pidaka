import { pool } from "./db";

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password text NOT NULL DEFAULT '',
    phone text UNIQUE,
    auth_provider text NOT NULL DEFAULT 'password',
    auth_subject text NOT NULL DEFAULT '',
    anonymous_name text NOT NULL UNIQUE,
    burns_sent_count integer NOT NULL DEFAULT 0,
    burns_received_count integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS pidakas (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    creator_user_id varchar NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    expires_at timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS burns (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    pidaka_id varchar NOT NULL,
    sender_user_id varchar NOT NULL,
    receiver_user_id varchar NOT NULL,
    message text NOT NULL,
    pidaka_excerpt text NOT NULL DEFAULT '',
    read_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS pidaka_views (
    pidaka_id varchar NOT NULL,
    viewer_id varchar NOT NULL,
    seen_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (pidaka_id, viewer_id)
  )`,
];

export async function ensureSchema(): Promise<void> {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query("select 1");
    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    client.release();
  }
}
