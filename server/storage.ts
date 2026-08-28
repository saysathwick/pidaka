import { eq, desc, lt, sql, and, inArray } from "drizzle-orm";
import { db, isDemoMode } from "./db";
import { DemoStorage } from "./demo-storage";
import { excerptPidaka } from "@shared/names";
import {
  users,
  pidakas,
  burns,
  pidakaViews,
  pushSubscriptions,
  devicePushTokens,
  wallSettings,
  type User,
  type InsertUser,
  type Pidaka,
  type Burn,
} from "@shared/schema";
import { parseNoticeColor, parseNoticeFont, parseNoticeLinks, parseNoticeSize, parseNoticeStyle, WALL_SETTINGS_ID, type WallSettings } from "@shared/wall";
import { blind, isBlind, seal } from "./crypto";
import { revealBurn, revealPidaka, revealUser, vaultUserInsert } from "./vault";

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

  savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }): Promise<void>;
  listPushSubscriptions(userId: string): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
  deletePushSubscriptionByEndpoint(endpoint: string): Promise<void>;

  saveDevicePushToken(userId: string, token: string, platform: "android" | "ios"): Promise<void>;
  listDevicePushTokens(userId: string): Promise<Array<{ token: string; platform: string }>>;
  deleteDevicePushToken(userId: string, token: string): Promise<void>;
  deleteDevicePushTokenByToken(token: string): Promise<void>;

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
    return user ? revealUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.toLowerCase();
    const hashed = blind(normalized);
    const [byHash] = await db.select().from(users).where(eq(users.email, hashed));
    if (byHash) return revealUser(byHash);
    const [byPlain] = await db.select().from(users).where(eq(users.email, normalized));
    return byPlain ? revealUser(byPlain) : undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const hashed = isBlind(phone) ? phone : blind(phone);
    const [byHash] = await db.select().from(users).where(eq(users.phone, hashed));
    if (byHash) return revealUser(byHash);
    const [byPlain] = await db.select().from(users).where(eq(users.phone, phone));
    return byPlain ? revealUser(byPlain) : undefined;
  }

  async getUserByAuth(provider: string, subject: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.authProvider, provider), eq(users.authSubject, subject)));
    return user ? revealUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const vaulted = vaultUserInsert({ email: insertUser.email, phone: insertUser.phone });
    const [user] = await db.insert(users).values({ ...insertUser, ...vaulted }).returning();
    return revealUser(user);
  }

  async getUserByAnonymousName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.anonymousName, name));
    return user ? revealUser(user) : undefined;
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
    const rows = await db
      .select()
      .from(pidakas)
      .where(sql`${pidakas.expiresAt} > ${now}`)
      .orderBy(desc(pidakas.createdAt))
      .limit(150);
    return rows.map(revealPidaka);
  }

  async getPidakasByCreator(userId: string): Promise<Pidaka[]> {
    const now = new Date();
    const rows = await db
      .select()
      .from(pidakas)
      .where(and(eq(pidakas.creatorUserId, userId), sql`${pidakas.expiresAt} > ${now}`))
      .orderBy(desc(pidakas.createdAt));
    return rows.map(revealPidaka);
  }

  async createPidaka(content: string, creatorUserId: string): Promise<Pidaka> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const [pidaka] = await db
      .insert(pidakas)
      .values({ content: seal(content), creatorUserId, expiresAt })
      .returning();
    return revealPidaka(pidaka);
  }

  async getPidaka(id: string): Promise<Pidaka | undefined> {
    const [pidaka] = await db.select().from(pidakas).where(eq(pidakas.id, id));
    return pidaka ? revealPidaka(pidaka) : undefined;
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
      .values({
        pidakaId,
        senderUserId,
        receiverUserId,
        message: seal(message),
        pidakaExcerpt: seal(pidakaExcerpt),
      })
      .returning();

    await db
      .update(users)
      .set({ burnsSentCount: sql`${users.burnsSentCount} + 1` })
      .where(eq(users.id, senderUserId));

    await db
      .update(users)
      .set({ burnsReceivedCount: sql`${users.burnsReceivedCount} + 1` })
      .where(eq(users.id, receiverUserId));

    return revealBurn(burn);
  }

  async getUserBurnsInbox(userId: string): Promise<Burn[]> {
    const rows = await db
      .select()
      .from(burns)
      .where(eq(burns.receiverUserId, userId))
      .orderBy(desc(burns.createdAt))
      .limit(100);
    return rows.map(revealBurn);
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

  async savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }) {
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: sub.p256dh, auth: sub.auth, createdAt: new Date() },
      });
    const kept = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(desc(pushSubscriptions.createdAt));
    const extra = kept.slice(8).map((row) => row.id);
    if (extra.length > 0) {
      await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, extra));
    }
  }

  async listPushSubscriptions(userId: string) {
    return db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(userId: string, endpoint: string) {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  }

  async deletePushSubscriptionByEndpoint(endpoint: string) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async saveDevicePushToken(userId: string, token: string, platform: "android" | "ios") {
    await db
      .insert(devicePushTokens)
      .values({ userId, token, platform })
      .onConflictDoUpdate({
        target: devicePushTokens.token,
        set: { userId, platform, createdAt: new Date() },
      });
    const kept = await db
      .select({ id: devicePushTokens.id })
      .from(devicePushTokens)
      .where(eq(devicePushTokens.userId, userId))
      .orderBy(desc(devicePushTokens.createdAt));
    const extra = kept.slice(8).map((row) => row.id);
    if (extra.length > 0) {
      await db.delete(devicePushTokens).where(inArray(devicePushTokens.id, extra));
    }
  }

  async listDevicePushTokens(userId: string) {
    return db
      .select({ token: devicePushTokens.token, platform: devicePushTokens.platform })
      .from(devicePushTokens)
      .where(eq(devicePushTokens.userId, userId));
  }

  async deleteDevicePushToken(userId: string, token: string) {
    await db
      .delete(devicePushTokens)
      .where(and(eq(devicePushTokens.userId, userId), eq(devicePushTokens.token, token)));
  }

  async deleteDevicePushTokenByToken(token: string) {
    await db.delete(devicePushTokens).where(eq(devicePushTokens.token, token));
  }

  async getWitnessCounts(): Promise<Record<string, number>> {
    const live = await db
      .select({ id: pidakas.id })
      .from(pidakas)
      .where(sql`${pidakas.expiresAt} > ${new Date()}`)
      .orderBy(desc(pidakas.createdAt))
      .limit(150);
    const ids = live.map((row) => row.id);
    if (ids.length === 0) return {};
    const rows = await db
      .select({
        pidakaId: pidakaViews.pidakaId,
        count: sql<number>`count(*)`,
      })
      .from(pidakaViews)
      .where(inArray(pidakaViews.pidakaId, ids))
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
      .values({ id: WALL_SETTINGS_ID, ...toSettingsRow(seed) })
      .onConflictDoNothing()
      .returning();
    if (created) return fromRow(created);
    const [again] = await db.select().from(wallSettings).where(eq(wallSettings.id, WALL_SETTINGS_ID));
    return again ? fromRow(again) : seed;
  }

  async saveWallSettings(next: WallSettings): Promise<WallSettings> {
    const [row] = await db
      .insert(wallSettings)
      .values({ id: WALL_SETTINGS_ID, ...toSettingsRow(next), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: wallSettings.id,
        set: { ...toSettingsRow(next), updatedAt: new Date() },
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
      .orderBy(desc(pidakas.createdAt))
      .limit(200);
    return rows.map((row) => ({
      ...row,
      content: revealPidaka(row).content,
      anonymousName: row.anonymousName || "unnamed",
    }));
  }

  async listAdminUsers() {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
    return rows.map((user) => {
      const revealed = revealUser(user);
      return {
        id: revealed.id,
        email: revealed.email,
        anonymousName: revealed.anonymousName,
        authProvider: revealed.authProvider,
        createdAt: revealed.createdAt,
      };
    });
  }
}

function toSettingsRow(next: WallSettings) {
  return {
    googleLogin: next.googleLogin,
    appleLogin: next.appleLogin,
    phoneLogin: next.phoneLogin,
    emailLogin: next.emailLogin,
    registrationsOpen: next.registrationsOpen,
    postingOpen: next.postingOpen,
    burningOpen: next.burningOpen,
    noticeOpen: next.noticeOpen,
    notice: next.notice,
    noticeLinks: JSON.stringify(parseNoticeLinks(next.noticeLinks)),
    noticeStyle: parseNoticeStyle(next.noticeStyle),
    noticeFont: parseNoticeFont(next.noticeFont),
    noticeSize: parseNoticeSize(next.noticeSize),
    noticeColor: parseNoticeColor(next.noticeColor),
  };
}

function fromRow(row: {
  googleLogin: boolean;
  appleLogin: boolean;
  phoneLogin: boolean;
  emailLogin: boolean;
  registrationsOpen: boolean;
  postingOpen: boolean;
  burningOpen: boolean;
  noticeOpen?: boolean | null;
  notice: string;
  noticeLinks?: unknown;
  noticeStyle?: unknown;
  noticeFont?: unknown;
  noticeSize?: unknown;
  noticeColor?: unknown;
}): WallSettings {
  return {
    googleLogin: row.googleLogin,
    appleLogin: row.appleLogin,
    phoneLogin: row.phoneLogin,
    emailLogin: row.emailLogin,
    registrationsOpen: row.registrationsOpen,
    postingOpen: row.postingOpen,
    burningOpen: row.burningOpen,
    noticeOpen: row.noticeOpen !== false,
    notice: row.notice,
    noticeLinks: parseNoticeLinks(row.noticeLinks),
    noticeStyle: parseNoticeStyle(row.noticeStyle),
    noticeFont: parseNoticeFont(row.noticeFont),
    noticeSize: parseNoticeSize(row.noticeSize),
    noticeColor: parseNoticeColor(row.noticeColor),
  };
}

export const storage: IStorage = isDemoMode
  ? new DemoStorage()
  : new DatabaseStorage();
