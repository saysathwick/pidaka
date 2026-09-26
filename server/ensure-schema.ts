import { pool } from "./db";

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    email_enc text,
    password text NOT NULL DEFAULT '',
    phone text UNIQUE,
    phone_enc text,
    auth_provider text NOT NULL DEFAULT 'password',
    auth_subject text NOT NULL DEFAULT '',
    anonymous_name text NOT NULL UNIQUE,
    burns_sent_count integer NOT NULL DEFAULT 0,
    burns_received_count integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_enc text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_enc text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'password'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_subject text NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS said_origin text NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS location_json text NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_json text NOT NULL DEFAULT ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone)`,
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
  `ALTER TABLE burns ADD COLUMN IF NOT EXISTS pidaka_excerpt text NOT NULL DEFAULT ''`,
  `ALTER TABLE burns ADD COLUMN IF NOT EXISTS read_at timestamp`,
  `CREATE TABLE IF NOT EXISTS pidaka_views (
    pidaka_id varchar NOT NULL,
    viewer_id varchar NOT NULL,
    seen_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (pidaka_id, viewer_id)
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id)`,
  `CREATE TABLE IF NOT EXISTS device_push_tokens (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    token text NOT NULL UNIQUE,
    platform text NOT NULL DEFAULT 'android',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS device_push_tokens_user_id_idx ON device_push_tokens (user_id)`,
  `CREATE TABLE IF NOT EXISTS wall_settings (
    id varchar PRIMARY KEY,
    google_login boolean NOT NULL DEFAULT false,
    apple_login boolean NOT NULL DEFAULT false,
    phone_login boolean NOT NULL DEFAULT true,
    email_login boolean NOT NULL DEFAULT true,
    registrations_open boolean NOT NULL DEFAULT true,
    posting_open boolean NOT NULL DEFAULT true,
    burning_open boolean NOT NULL DEFAULT true,
    notice text NOT NULL DEFAULT '',
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_links text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_open boolean NOT NULL DEFAULT true`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_title text NOT NULL DEFAULT ''`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_style text NOT NULL DEFAULT 'still'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_font text NOT NULL DEFAULT 'sans'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_size text NOT NULL DEFAULT 'md'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS notice_color text NOT NULL DEFAULT 'muted'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS burn_alert_title text NOT NULL DEFAULT 'Pidaka'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS burn_alert_body_one text NOT NULL DEFAULT 'A burn arrived.'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS burn_alert_body_many text NOT NULL DEFAULT '{n} burns are waiting.'`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS guest_login boolean NOT NULL DEFAULT true`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS safety_check_open boolean NOT NULL DEFAULT false`,
  `ALTER TABLE wall_settings ADD COLUMN IF NOT EXISTS moderation_keywords text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE pidakas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'live'`,
  `ALTER TABLE pidakas ADD COLUMN IF NOT EXISTS flag_reason text NOT NULL DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS account_requests (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    kind text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    anonymous_name text NOT NULL DEFAULT '',
    auth_provider text NOT NULL DEFAULT '',
    auth_subject text NOT NULL DEFAULT '',
    email text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    snapshot_json text NOT NULL DEFAULT '{}',
    created_at timestamp NOT NULL DEFAULT now(),
    resolved_at timestamp
  )`,
  `CREATE INDEX IF NOT EXISTS account_requests_status_idx ON account_requests (status)`,
  `CREATE INDEX IF NOT EXISTS account_requests_user_id_idx ON account_requests (user_id)`,
  `CREATE TABLE IF NOT EXISTS archived_accounts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    original_user_id varchar NOT NULL,
    status text NOT NULL,
    anonymous_name text NOT NULL DEFAULT '',
    auth_provider text NOT NULL DEFAULT '',
    auth_subject text NOT NULL DEFAULT '',
    email text NOT NULL DEFAULT '',
    phone text NOT NULL DEFAULT '',
    snapshot_json text NOT NULL DEFAULT '{}',
    request_id varchar,
    archived_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS archived_accounts_status_idx ON archived_accounts (status)`,
  `CREATE INDEX IF NOT EXISTS archived_accounts_auth_idx ON archived_accounts (auth_provider, auth_subject)`,
  `CREATE INDEX IF NOT EXISTS archived_accounts_email_idx ON archived_accounts (email)`,
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
