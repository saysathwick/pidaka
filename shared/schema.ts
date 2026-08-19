import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull().default(""),
  phone: text("phone").unique(),
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

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
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
