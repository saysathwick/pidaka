import { eq, desc, lt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  pidakas,
  burns,
  type User,
  type InsertUser,
  type Pidaka,
  type Burn,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserStats(id: string): Promise<{ burnsSentCount: number; burnsReceivedCount: number }>;

  getActivePidakas(): Promise<Pidaka[]>;
  createPidaka(content: string, creatorUserId: string): Promise<Pidaka>;
  getPidaka(id: string): Promise<Pidaka | undefined>;
  deleteExpiredPidakas(): Promise<void>;

  createBurn(pidakaId: string, senderUserId: string, receiverUserId: string, message: string): Promise<Burn>;
  getUserBurnsInbox(userId: string): Promise<Burn[]>;
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
    const expiredPidakaIds = await db
      .select({ id: pidakas.id })
      .from(pidakas)
      .where(lt(pidakas.expiresAt, now));

    if (expiredPidakaIds.length > 0) {
      const ids = expiredPidakaIds.map((p) => p.id);
      for (const id of ids) {
        await db.delete(burns).where(eq(burns.pidakaId, id));
      }
      await db.delete(pidakas).where(lt(pidakas.expiresAt, now));
    }
  }

  async createBurn(
    pidakaId: string,
    senderUserId: string,
    receiverUserId: string,
    message: string
  ): Promise<Burn> {
    const [burn] = await db
      .insert(burns)
      .values({ pidakaId, senderUserId, receiverUserId, message })
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
}

export const storage = new DatabaseStorage();
