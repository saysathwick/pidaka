import { eq, desc, lt, sql, and } from "drizzle-orm";
import { db, isDemoMode } from "./db";
import { DemoStorage } from "./demo-storage";
import { excerptPidaka } from "@shared/names";
import {
  users,
  pidakas,
  burns,
  pidakaViews,
  wallSettings,
  type User,
  type InsertUser,
  type Pidaka,
  type Burn,
} from "@shared/schema";
import { WALL_SETTINGS_ID, type WallSettings } from "@shared/wall";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByAuth(provider: string, subject: string): Promise<User | undefined>;
  getUserByAnonymousName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserStats(id: string): Promise<{ burnsSentCount: number; burnsReceivedCount: number }>;

  getActivePidakas(): Promise<Pidaka[]>;
  getPidakasByCreator(userId: string): Promise<Pidaka[]>;
  createPidaka(content: string, creatorUserId: string): Promise<Pidaka>;
  getPidaka(id: string): Promise<Pidaka | undefined>;
  deletePidaka(id: string): Promise<boolean>;
  deleteExpiredPidakas(): Promise<void>;

  createBurn(pidakaId: string, senderUserId: string, receiverUserId: string, message: string): Promise<Burn>;
  getUserBurnsInbox(userId: string): Promise<Burn[]>;
  countUnreadBurns(userId: string): Promise<number>;
  markBurnsRead(userId: string): Promise<void>;
  getSeenIds(viewerId: string): Promise<string[]>;
  markSeen(pidakaId: string, viewerId: string): Promise<void>;
  getWitnessCounts(): Promise<Record<string, number>>;

  getWallSettings(seed: WallSettings): Promise<WallSettings>;
  saveWallSettings(next: WallSettings): Promise<WallSettings>;
  adminStats(): Promise<{ users: number; pidakas: number; burns: number }>;
  listAdminPidakas(): Promise<Array<{
    id: string;
    content: string;
    createdAt: Date;
    expiresAt: Date;
    creatorUserId: string;
    anonymousName: string;
  }>>;
  listAdminUsers(): Promise<Array<{
    id: string;
    email: string;
    anonymousName: string;
    authProvider: string;
    createdAt: Date;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByAuth(provider: string, subject: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.authProvider, provider), eq(users.authSubject, subject)));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByAnonymousName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.anonymousName, name));
    return user;
  }

  async getUserStats(id: string): Promise<{ burnsSentCount: number; burnsReceivedCount: number }> {
    const [user] = await db
      .select({
        burnsSentCount: users.burnsSentCount,
        burnsReceivedCount: users.burnsReceivedCount,
      })
      .from(users)
      .where(eq(users.id, id));
    return user || { burnsSentCount: 0, burnsReceivedCount: 0 };
  }

  async getActivePidakas(): Promise<Pidaka[]> {
    const now = new Date();
    return db
      .select()
      .from(pidakas)
      .where(sql`${pidakas.expiresAt} > ${now}`)
      .orderBy(desc(pidakas.createdAt));
  }

  async getPidakasByCreator(userId: string): Promise<Pidaka[]> {
    const now = new Date();
    return db
      .select()
      .from(pidakas)
      .where(and(eq(pidakas.creatorUserId, userId), sql`${pidakas.expiresAt} > ${now}`))
      .orderBy(desc(pidakas.createdAt));
  }

  async createPidaka(content: string, creatorUserId: string): Promise<Pidaka> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const [pidaka] = await db
      .insert(pidakas)
      .values({ content, creatorUserId, expiresAt })
      .returning();
    return pidaka;
  }

  async getPidaka(id: string): Promise<Pidaka | undefined> {
    const [pidaka] = await db.select().from(pidakas).where(eq(pidakas.id, id));
    return pidaka;
  }

  async deleteExpiredPidakas(): Promise<void> {
    const now = new Date();
    await db.delete(pidakaViews).where(
      sql`${pidakaViews.pidakaId} in (select ${pidakas.id} from ${pidakas} where ${pidakas.expiresAt} < ${now})`,
    );
    await db.delete(pidakas).where(lt(pidakas.expiresAt, now));
  }

  async createBurn(
    pidakaId: string,
    senderUserId: string,
    receiverUserId: string,
    message: string
  ): Promise<Burn> {
    const pidaka = await this.getPidaka(pidakaId);
    const pidakaExcerpt = excerptPidaka(pidaka?.content ?? "");

    const [burn] = await db
      .insert(burns)
      .values({ pidakaId, senderUserId, receiverUserId, message, pidakaExcerpt })
      .returning();

    await db
      .update(users)
      .set({ burnsSentCount: sql`${users.burnsSentCount} + 1` })
      .where(eq(users.id, senderUserId));

    await db
      .update(users)
      .set({ burnsReceivedCount: sql`${users.burnsReceivedCount} + 1` })
      .where(eq(users.id, receiverUserId));

    return burn;
  }

  async getUserBurnsInbox(userId: string): Promise<Burn[]> {
    return db
      .select()
      .from(burns)
      .where(eq(burns.receiverUserId, userId))
      .orderBy(desc(burns.createdAt));
  }

  async countUnreadBurns(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(burns)
      .where(sql`${burns.receiverUserId} = ${userId} AND ${burns.readAt} IS NULL`);
    return Number(row?.count ?? 0);
  }

  async markBurnsRead(userId: string): Promise<void> {
    await db
      .update(burns)
      .set({ readAt: new Date() })
      .where(sql`${burns.receiverUserId} = ${userId} AND ${burns.readAt} IS NULL`);
  }

  async getSeenIds(viewerId: string): Promise<string[]> {
    const rows = await db
      .select({ pidakaId: pidakaViews.pidakaId })
      .from(pidakaViews)
      .where(eq(pidakaViews.viewerId, viewerId));
    return rows.map((row) => row.pidakaId);
  }

  async markSeen(pidakaId: string, viewerId: string): Promise<void> {
    await db
      .insert(pidakaViews)
      .values({ pidakaId, viewerId })
      .onConflictDoNothing();
  }

  async getWitnessCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({
        pidakaId: pidakaViews.pidakaId,
        count: sql<number>`count(*)`,
      })
      .from(pidakaViews)
      .groupBy(pidakaViews.pidakaId);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.pidakaId] = Number(row.count);
    }
    return counts;
  }

  async deletePidaka(id: string): Promise<boolean> {
    await db.delete(pidakaViews).where(eq(pidakaViews.pidakaId, id));
    const removed = await db.delete(pidakas).where(eq(pidakas.id, id)).returning({ id: pidakas.id });
    return removed.length > 0;
  }

  async getWallSettings(seed: WallSettings): Promise<WallSettings> {
    const [row] = await db.select().from(wallSettings).where(eq(wallSettings.id, WALL_SETTINGS_ID));
    if (row) return fromRow(row);
    const [created] = await db
      .insert(wallSettings)
      .values({ id: WALL_SETTINGS_ID, ...seed })
      .onConflictDoNothing()
      .returning();
    if (created) return fromRow(created);
    const [again] = await db.select().from(wallSettings).where(eq(wallSettings.id, WALL_SETTINGS_ID));
    return again ? fromRow(again) : seed;
  }

  async saveWallSettings(next: WallSettings): Promise<WallSettings> {
    const [row] = await db
      .insert(wallSettings)
      .values({ id: WALL_SETTINGS_ID, ...next, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: wallSettings.id,
        set: { ...next, updatedAt: new Date() },
      })
      .returning();
    return fromRow(row);
  }

  async adminStats() {
    const now = new Date();
    const [usersRow] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [pidakaRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pidakas)
      .where(sql`${pidakas.expiresAt} > ${now}`);
    const [burnRow] = await db.select({ count: sql<number>`count(*)` }).from(burns);
    return {
      users: Number(usersRow?.count ?? 0),
      pidakas: Number(pidakaRow?.count ?? 0),
      burns: Number(burnRow?.count ?? 0),
    };
  }

  async listAdminPidakas() {
    const now = new Date();
    const rows = await db
      .select({
        id: pidakas.id,
        content: pidakas.content,
        createdAt: pidakas.createdAt,
        expiresAt: pidakas.expiresAt,
        creatorUserId: pidakas.creatorUserId,
        anonymousName: users.anonymousName,
      })
      .from(pidakas)
      .leftJoin(users, eq(pidakas.creatorUserId, users.id))
      .where(sql`${pidakas.expiresAt} > ${now}`)
      .orderBy(desc(pidakas.createdAt));
    return rows.map((row) => ({
      ...row,
      anonymousName: row.anonymousName || "unnamed",
    }));
  }

  async listAdminUsers() {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        anonymousName: users.anonymousName,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }
}

function fromRow(row: {
  googleLogin: boolean;
  appleLogin: boolean;
  phoneLogin: boolean;
  emailLogin: boolean;
  registrationsOpen: boolean;
  postingOpen: boolean;
  burningOpen: boolean;
  notice: string;
}): WallSettings {
  return {
    googleLogin: row.googleLogin,
    appleLogin: row.appleLogin,
    phoneLogin: row.phoneLogin,
    emailLogin: row.emailLogin,
    registrationsOpen: row.registrationsOpen,
    postingOpen: row.postingOpen,
    burningOpen: row.burningOpen,
    notice: row.notice,
  };
}

export const storage: IStorage = isDemoMode
  ? new DemoStorage()
  : new DatabaseStorage();
