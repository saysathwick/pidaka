import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertPidakaSchema = z.object({
  content: z.string().min(1, "Content is required").max(500, "Maximum 500 characters"),
});

export const insertBurnSchema = z.object({
  message: z.string().min(1, "Message is required").max(500, "Maximum 500 characters"),
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
