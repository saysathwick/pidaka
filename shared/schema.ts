import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, primaryKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  emailEnc: text("email_enc"),
  password: text("password").notNull().default(""),
  phone: text("phone").unique(),
  phoneEnc: text("phone_enc"),
  authProvider: text("auth_provider").notNull().default("password"),
  authSubject: text("auth_subject").notNull().default(""),
  anonymousName: text("anonymous_name").notNull().unique(),
  burnsSentCount: integer("burns_sent_count").notNull().default(0),
  burnsReceivedCount: integer("burns_received_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pidakas = pgTable("pidakas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  creatorUserId: varchar("creator_user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const burns = pgTable("burns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pidakaId: varchar("pidaka_id").notNull(),
  senderUserId: varchar("sender_user_id").notNull(),
  receiverUserId: varchar("receiver_user_id").notNull(),
  message: text("message").notNull(),
  pidakaExcerpt: text("pidaka_excerpt").notNull().default(""),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pidakaViews = pgTable(
  "pidaka_views",
  {
    pidakaId: varchar("pidaka_id").notNull(),
    viewerId: varchar("viewer_id").notNull(),
    seenAt: timestamp("seen_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pidakaId, table.viewerId] }),
  }),
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devicePushTokens = pgTable("device_push_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("android"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wallSettings = pgTable("wall_settings", {
  id: varchar("id").primaryKey(),
  googleLogin: boolean("google_login").notNull().default(false),
  appleLogin: boolean("apple_login").notNull().default(false),
  phoneLogin: boolean("phone_login").notNull().default(true),
  emailLogin: boolean("email_login").notNull().default(true),
  registrationsOpen: boolean("registrations_open").notNull().default(true),
  postingOpen: boolean("posting_open").notNull().default(true),
  burningOpen: boolean("burning_open").notNull().default(true),
  noticeOpen: boolean("notice_open").notNull().default(true),
  notice: text("notice").notNull().default(""),
  noticeLinks: text("notice_links").notNull().default("[]"),
  noticeStyle: text("notice_style").notNull().default("still"),
  noticeFont: text("notice_font").notNull().default("sans"),
  noticeSize: text("notice_size").notNull().default("md"),
  noticeColor: text("notice_color").notNull().default("muted"),
  burnAlertTitle: text("burn_alert_title").notNull().default("Pidaka"),
  burnAlertBodyOne: text("burn_alert_body_one").notNull().default("A burn arrived."),
  burnAlertBodyMany: text("burn_alert_body_many").notNull().default("{n} burns are waiting."),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export function isPlausibleEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  if (!/^[a-z0-9._%+-]+$/i.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,24}$/i.test(tld)) return false;
  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label),
  );
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isPlausibleEmail, { message: "Enter a real email address" });

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const phoneStartSchema = z.object({
  phone: z.string().min(8, "Enter a phone number"),
});

export const phoneVerifySchema = z.object({
  phone: z.string().min(8, "Enter a phone number"),
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit code"),
});

export const insertPidakaSchema = z.object({
  content: z.string().min(1, "Content is required").max(3000, "Maximum 3000 characters"),
});

export const insertBurnSchema = z.object({
  message: z.string().min(1, "Message is required").max(3000, "Maximum 3000 characters"),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(20).max(256),
    auth: z.string().min(8).max(256),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export const devicePushRegisterSchema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(["android", "ios"]).default("android"),
});

export const devicePushUnregisterSchema = z.object({
  token: z.string().min(20).max(4096),
});

export const adminSessionSchema = z.object({
  secret: z.string().min(1, "Enter the hearth key"),
});

export const wallSettingsPatchSchema = z.object({
  googleLogin: z.boolean().optional(),
  appleLogin: z.boolean().optional(),
  phoneLogin: z.boolean().optional(),
  emailLogin: z.boolean().optional(),
  registrationsOpen: z.boolean().optional(),
  postingOpen: z.boolean().optional(),
  burningOpen: z.boolean().optional(),
  noticeOpen: z.boolean().optional(),
  notice: z.string().max(280, "Keep the notice under 280 characters").optional(),
  noticeStyle: z.enum(["still", "scroll", "blink", "pulse"]).optional(),
  noticeFont: z.enum(["sans", "serif", "mono"]).optional(),
  noticeSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
  noticeColor: z.enum(["muted", "ember", "snow", "copper", "ochre", "wine", "indigo", "blue"]).optional(),
  noticeLinks: z
    .array(
      z.object({
        name: z.string().max(48),
        href: z.string().max(2048),
        file: z.boolean().optional(),
      }),
    )
    .max(4)
    .optional(),
  burnAlertTitle: z.string().max(48).optional(),
  burnAlertBodyOne: z.string().max(120).optional(),
  burnAlertBodyMany: z.string().max(120).optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  burnsSentCount: true,
  burnsReceivedCount: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Pidaka = typeof pidakas.$inferSelect;
export type Burn = typeof burns.$inferSelect;
export type PidakaView = typeof pidakaViews.$inferSelect;
export type WallSettingsRow = typeof wallSettings.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type DevicePushTokenRow = typeof devicePushTokens.$inferSelect;
