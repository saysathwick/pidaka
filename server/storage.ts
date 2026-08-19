import { eq, desc, lt, sql } from "drizzle-orm";
import { db, isDemoMode } from "./db";
import { DemoStorage } from "./demo-storage";
import { excerptPidaka } from "@shared/names";
import {
  users,
  pidakas,
  burns,
  pidakaViews,
  type User,
  type InsertUser,
  type Pidaka,
  type Burn,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAnonymousName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserStats(id: string): Promise<{ burnsSentCount: number; burnsReceivedCount: number }>;

  getActivePidakas(): Promise<Pidaka[]>;
  createPidaka(content: string, creatorUserId: string): Promise<Pidaka>;
  getPidaka(id: string): Promise<Pidaka | undefined>;
  deleteExpiredPidakas(): Promise<void>;

  createBurn(pidakaId: string, senderUserId: string, receiverUserId: string, message: string): Promise<Burn>;
  getUserBurnsInbox(userId: string): Promise<Burn[]>;
  countUnreadBurns(userId: string): Promise<number>;
  markBurnsRead(userId: string): Promise<void>;
  getSeenIds(viewerId: string): Promise<string[]>;
  markSeen(pidakaId: string, viewerId: string): Promise<void>;
  getWitnessCounts(): Promise<Record<string, number>>;
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
}

export const storage: IStorage = isDemoMode
  ? new DemoStorage()
  : new DatabaseStorage();
