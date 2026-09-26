import { eq, desc, lt, sql, and, inArray, or } from "drizzle-orm";
import { db, isDemoMode } from "./db";
import { DemoStorage } from "./demo-storage";
import { excerptPidaka } from "@shared/names";
import { burnAlertFromSettings, sanitizeBurnAlertBodyMany, sanitizeBurnAlertBodyOne, sanitizeBurnAlertTitle } from "@shared/burn-alert";
import {
  users,
  pidakas,
  burns,
  pidakaViews,
  pushSubscriptions,
  devicePushTokens,
  wallSettings,
  accountRequests,
  archivedAccounts,
  type User,
  type InsertUser,
  type Pidaka,
  type Burn,
  type AccountRequestRow,
  type ArchivedAccountRow,
  type AccountRequestKind,
  type AccountArchiveStatus,
} from "@shared/schema";
import { parseNoticeColor, parseNoticeFont, parseNoticeLinks, parseNoticeSize, parseNoticeStyle, WALL_SETTINGS_ID, type PidakaStatus, type WallSettings } from "@shared/wall";
import { parseModerationKeywords, sanitizeModerationKeywords } from "@shared/moderation";
import { blind, isBlind, seal } from "./crypto";
import { revealBurn, revealPidaka, revealUser, vaultUserInsert } from "./vault";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByAuth(provider: string, subject: string): Promise<User | undefined>;
  getUserByAnonymousName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateGuestProvenance(
    userId: string,
    data: { saidOrigin: string; locationJson: string; deviceJson: string },
  ): Promise<void>;
  updateDeviceJson(userId: string, deviceJson: string): Promise<void>;
  getUserStats(id: string): Promise<{ burnsSentCount: number; burnsReceivedCount: number }>;

  getActivePidakas(): Promise<Pidaka[]>;
  getPidakasByCreator(userId: string): Promise<Pidaka[]>;
  createPidaka(
    content: string,
    creatorUserId: string,
    opts?: { status?: PidakaStatus; flagReason?: string },
  ): Promise<Pidaka>;
  getPidaka(id: string): Promise<Pidaka | undefined>;
  setPidakaStatus(id: string, status: PidakaStatus, flagReason?: string): Promise<Pidaka | undefined>;
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
    status: PidakaStatus;
    flagReason: string;
  }>>;
  listAdminUsers(): Promise<Array<{
    id: string;
    email: string;
    anonymousName: string;
    authProvider: string;
    saidOrigin?: string;
    locationJson?: string;
    deviceJson?: string;
    createdAt: Date;
  }>>;

  createAccountRequest(userId: string, kind: "deactivate" | "delete"): Promise<AccountRequestRow>;
  createActivateRequest(archived: ArchivedAccountRow): Promise<AccountRequestRow>;
  getPendingAccountRequestForUser(userId: string): Promise<AccountRequestRow | undefined>;
  listPendingAccountRequests(): Promise<AccountRequestRow[]>;
  getAccountRequest(id: string): Promise<AccountRequestRow | undefined>;
  rejectAccountRequest(id: string): Promise<AccountRequestRow | undefined>;
  approveDeactivateRequest(id: string): Promise<{ request: AccountRequestRow; archived: ArchivedAccountRow } | undefined>;
  approveDeleteRequest(id: string): Promise<{ request: AccountRequestRow; archived: ArchivedAccountRow } | undefined>;
  approveActivateRequest(id: string): Promise<{ request: AccountRequestRow; user: User } | undefined>;
  suspendUser(userId: string): Promise<ArchivedAccountRow | undefined>;
  unsuspendArchived(archivedId: string): Promise<User | undefined>;
  findArchivedByAuth(provider: string, subject: string): Promise<ArchivedAccountRow | undefined>;
  findArchivedByEmail(email: string): Promise<ArchivedAccountRow | undefined>;
  findArchivedByPhone(phone: string): Promise<ArchivedAccountRow | undefined>;
  listArchivedAccounts(): Promise<ArchivedAccountRow[]>;
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

  async updateGuestProvenance(
    userId: string,
    data: { saidOrigin: string; locationJson: string; deviceJson: string },
  ) {
    await db
      .update(users)
      .set({
        saidOrigin: data.saidOrigin,
        locationJson: data.locationJson,
        deviceJson: data.deviceJson,
      })
      .where(eq(users.id, userId));
  }

  async updateDeviceJson(userId: string, deviceJson: string) {
    await db.update(users).set({ deviceJson }).where(eq(users.id, userId));
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
      .where(and(sql`${pidakas.expiresAt} > ${now}`, eq(pidakas.status, "live")))
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

  async createPidaka(
    content: string,
    creatorUserId: string,
    opts?: { status?: PidakaStatus; flagReason?: string },
  ): Promise<Pidaka> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const [pidaka] = await db
      .insert(pidakas)
      .values({
        content: seal(content),
        creatorUserId,
        expiresAt,
        status: opts?.status ?? "live",
        flagReason: opts?.flagReason ?? "",
      })
      .returning();
    return revealPidaka(pidaka);
  }

  async getPidaka(id: string): Promise<Pidaka | undefined> {
    const [pidaka] = await db.select().from(pidakas).where(eq(pidakas.id, id));
    return pidaka ? revealPidaka(pidaka) : undefined;
  }

  async setPidakaStatus(id: string, status: PidakaStatus, flagReason?: string): Promise<Pidaka | undefined> {
    const [pidaka] = await db
      .update(pidakas)
      .set({
        status,
        ...(flagReason !== undefined ? { flagReason } : {}),
      })
      .where(eq(pidakas.id, id))
      .returning();
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
      .where(and(sql`${pidakas.expiresAt} > ${now}`, eq(pidakas.status, "live")));
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
        status: pidakas.status,
        flagReason: pidakas.flagReason,
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
      status: (row.status || "live") as PidakaStatus,
      flagReason: row.flagReason || "",
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
        saidOrigin: revealed.saidOrigin || "",
        locationJson: revealed.locationJson || "",
        deviceJson: revealed.deviceJson || "",
        createdAt: revealed.createdAt,
      };
    });
  }

  async createAccountRequest(userId: string, kind: "deactivate" | "delete") {
    const pending = await this.getPendingAccountRequestForUser(userId);
    if (pending) return pending;

    const [raw] = await db.select().from(users).where(eq(users.id, userId));
    if (!raw) throw new Error("User not found");
    const revealed = revealUser(raw);
    const [row] = await db
      .insert(accountRequests)
      .values({
        userId,
        kind,
        status: "pending",
        anonymousName: revealed.anonymousName,
        authProvider: raw.authProvider,
        authSubject: raw.authSubject || "",
        email: raw.email,
        phone: raw.phone || "",
        snapshotJson: JSON.stringify(raw),
      })
      .returning();
    return row;
  }

  async createActivateRequest(archived: ArchivedAccountRow) {
    const existing = await db
      .select()
      .from(accountRequests)
      .where(
        and(
          eq(accountRequests.userId, archived.originalUserId),
          eq(accountRequests.kind, "activate"),
          eq(accountRequests.status, "pending"),
        ),
      )
      .limit(1);
    if (existing[0]) return existing[0];

    const [row] = await db
      .insert(accountRequests)
      .values({
        userId: archived.originalUserId,
        kind: "activate",
        status: "pending",
        anonymousName: archived.anonymousName,
        authProvider: archived.authProvider,
        authSubject: archived.authSubject,
        email: archived.email,
        phone: archived.phone || "",
        snapshotJson: archived.snapshotJson,
      })
      .returning();
    return row;
  }

  async getPendingAccountRequestForUser(userId: string) {
    const [row] = await db
      .select()
      .from(accountRequests)
      .where(and(eq(accountRequests.userId, userId), eq(accountRequests.status, "pending")))
      .limit(1);
    return row;
  }

  async listPendingAccountRequests() {
    return db
      .select()
      .from(accountRequests)
      .where(eq(accountRequests.status, "pending"))
      .orderBy(desc(accountRequests.createdAt))
      .limit(200);
  }

  async getAccountRequest(id: string) {
    const [row] = await db.select().from(accountRequests).where(eq(accountRequests.id, id));
    return row;
  }

  async rejectAccountRequest(id: string) {
    const [row] = await db
      .update(accountRequests)
      .set({ status: "rejected", resolvedAt: new Date() })
      .where(and(eq(accountRequests.id, id), eq(accountRequests.status, "pending")))
      .returning();
    return row;
  }

  private async archiveFromRequest(request: AccountRequestRow, status: AccountArchiveStatus) {
    const archived = await this.moveUserToArchive(request.userId, status, request.id, request.snapshotJson);
    if (!archived) return undefined;

    const [updated] = await db
      .update(accountRequests)
      .set({ status: "approved", resolvedAt: new Date() })
      .where(eq(accountRequests.id, request.id))
      .returning();

    return { request: updated, archived };
  }

  private async moveUserToArchive(
    userId: string,
    status: AccountArchiveStatus,
    requestId?: string | null,
    snapshotJson?: string,
  ): Promise<ArchivedAccountRow | undefined> {
    let snap: User;
    let anonymousName = "";
    let authProvider = "";
    let authSubject = "";
    let email = "";
    let phone = "";

    if (snapshotJson) {
      try {
        snap = JSON.parse(snapshotJson) as User;
      } catch {
        throw new Error("Broken account snapshot");
      }
      anonymousName = snap.anonymousName;
      authProvider = snap.authProvider;
      authSubject = snap.authSubject || "";
      email = snap.email;
      phone = snap.phone || "";
    } else {
      const [raw] = await db.select().from(users).where(eq(users.id, userId));
      if (!raw) return undefined;
      snap = raw;
      const revealed = revealUser(raw);
      anonymousName = revealed.anonymousName;
      authProvider = raw.authProvider;
      authSubject = raw.authSubject || "";
      email = raw.email;
      phone = raw.phone || "";
      snapshotJson = JSON.stringify(raw);
    }

    if (status === "deleted") {
      const owned = await db.select({ id: pidakas.id }).from(pidakas).where(eq(pidakas.creatorUserId, userId));
      const ids = owned.map((row) => row.id);
      if (ids.length) {
        await db.delete(burns).where(inArray(burns.pidakaId, ids));
        await db.delete(pidakaViews).where(inArray(pidakaViews.pidakaId, ids));
        await db.delete(pidakas).where(inArray(pidakas.id, ids));
      }
      await db.delete(burns).where(
        or(eq(burns.senderUserId, userId), eq(burns.receiverUserId, userId)),
      );
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      await db.delete(devicePushTokens).where(eq(devicePushTokens.userId, userId));
    }

    await db
      .update(accountRequests)
      .set({ status: "rejected", resolvedAt: new Date() })
      .where(and(eq(accountRequests.userId, userId), eq(accountRequests.status, "pending")));

    await db.delete(users).where(eq(users.id, userId));

    const [archived] = await db
      .insert(archivedAccounts)
      .values({
        originalUserId: userId,
        status,
        anonymousName,
        authProvider,
        authSubject,
        email,
        phone,
        snapshotJson: snapshotJson!,
        requestId: requestId ?? null,
      })
      .returning();

    return archived;
  }

  async approveDeactivateRequest(id: string) {
    const request = await this.getAccountRequest(id);
    if (!request || request.status !== "pending" || request.kind !== "deactivate") return undefined;
    return this.archiveFromRequest(request, "deactivated");
  }

  async approveDeleteRequest(id: string) {
    const request = await this.getAccountRequest(id);
    if (!request || request.status !== "pending" || request.kind !== "delete") return undefined;
    return this.archiveFromRequest(request, "deleted");
  }

  private async restoreArchivedRow(archived: ArchivedAccountRow): Promise<User | undefined> {
    let snap: User;
    try {
      snap = JSON.parse(archived.snapshotJson) as User;
    } catch {
      throw new Error("Broken account snapshot");
    }

    const [user] = await db
      .insert(users)
      .values({
        id: snap.id,
        email: snap.email,
        emailEnc: snap.emailEnc,
        password: snap.password,
        phone: snap.phone,
        phoneEnc: snap.phoneEnc,
        authProvider: snap.authProvider,
        authSubject: snap.authSubject,
        anonymousName: snap.anonymousName,
        saidOrigin: snap.saidOrigin || "",
        locationJson: snap.locationJson || "",
        deviceJson: snap.deviceJson || "",
        burnsSentCount: snap.burnsSentCount || 0,
        burnsReceivedCount: snap.burnsReceivedCount || 0,
        createdAt: snap.createdAt ? new Date(snap.createdAt) : new Date(),
      })
      .returning();

    await db.delete(archivedAccounts).where(eq(archivedAccounts.id, archived.id));
    return revealUser(user);
  }

  async approveActivateRequest(id: string) {
    const request = await this.getAccountRequest(id);
    if (!request || request.status !== "pending" || request.kind !== "activate") return undefined;

    const [archived] = await db
      .select()
      .from(archivedAccounts)
      .where(and(eq(archivedAccounts.originalUserId, request.userId), eq(archivedAccounts.status, "deactivated")))
      .limit(1);
    if (!archived) return undefined;

    const user = await this.restoreArchivedRow(archived);
    if (!user) return undefined;

    const [updated] = await db
      .update(accountRequests)
      .set({ status: "approved", resolvedAt: new Date() })
      .where(eq(accountRequests.id, request.id))
      .returning();

    return { request: updated, user };
  }

  async suspendUser(userId: string) {
    return this.moveUserToArchive(userId, "suspended");
  }

  async unsuspendArchived(archivedId: string) {
    const [archived] = await db
      .select()
      .from(archivedAccounts)
      .where(and(eq(archivedAccounts.id, archivedId), eq(archivedAccounts.status, "suspended")))
      .limit(1);
    if (!archived) return undefined;
    return this.restoreArchivedRow(archived);
  }

  async findArchivedByAuth(provider: string, subject: string) {
    const [row] = await db
      .select()
      .from(archivedAccounts)
      .where(and(eq(archivedAccounts.authProvider, provider), eq(archivedAccounts.authSubject, subject)))
      .orderBy(desc(archivedAccounts.archivedAt))
      .limit(1);
    return row;
  }

  async findArchivedByEmail(email: string) {
    const hashed = blind(email.toLowerCase());
    const [byHash] = await db.select().from(archivedAccounts).where(eq(archivedAccounts.email, hashed)).limit(1);
    if (byHash) return byHash;
    const [byPlain] = await db.select().from(archivedAccounts).where(eq(archivedAccounts.email, email.toLowerCase())).limit(1);
    return byPlain;
  }

  async findArchivedByPhone(phone: string) {
    const hashed = blind(phone);
    const [byHash] = await db.select().from(archivedAccounts).where(eq(archivedAccounts.phone, hashed)).limit(1);
    if (byHash) return byHash;
    const [byPlain] = await db.select().from(archivedAccounts).where(eq(archivedAccounts.phone, phone)).limit(1);
    return byPlain;
  }

  async listArchivedAccounts() {
    return db.select().from(archivedAccounts).orderBy(desc(archivedAccounts.archivedAt)).limit(200);
  }
}

function toSettingsRow(next: WallSettings) {
  return {
    googleLogin: next.googleLogin,
    appleLogin: next.appleLogin,
    phoneLogin: next.phoneLogin,
    emailLogin: next.emailLogin,
    guestLogin: next.guestLogin,
    registrationsOpen: next.registrationsOpen,
    postingOpen: next.postingOpen,
    burningOpen: next.burningOpen,
    safetyCheckOpen: next.safetyCheckOpen,
    moderationKeywords: JSON.stringify(sanitizeModerationKeywords(next.moderationKeywords)),
    noticeOpen: next.noticeOpen,
    noticeTitle: next.noticeTitle,
    notice: next.notice,
    noticeLinks: JSON.stringify(parseNoticeLinks(next.noticeLinks)),
    noticeStyle: parseNoticeStyle(next.noticeStyle),
    noticeFont: parseNoticeFont(next.noticeFont),
    noticeSize: parseNoticeSize(next.noticeSize),
    noticeColor: parseNoticeColor(next.noticeColor),
    burnAlertTitle: sanitizeBurnAlertTitle(next.burnAlertTitle),
    burnAlertBodyOne: sanitizeBurnAlertBodyOne(next.burnAlertBodyOne),
    burnAlertBodyMany: sanitizeBurnAlertBodyMany(next.burnAlertBodyMany),
  };
}

function fromRow(row: {
  googleLogin: boolean;
  appleLogin: boolean;
  phoneLogin: boolean;
  emailLogin: boolean;
  guestLogin?: boolean | null;
  registrationsOpen: boolean;
  postingOpen: boolean;
  burningOpen: boolean;
  safetyCheckOpen?: boolean | null;
  moderationKeywords?: unknown;
  noticeOpen?: boolean | null;
  noticeTitle?: string | null;
  notice: string;
  noticeLinks?: unknown;
  noticeStyle?: unknown;
  noticeFont?: unknown;
  noticeSize?: unknown;
  noticeColor?: unknown;
  burnAlertTitle?: unknown;
  burnAlertBodyOne?: unknown;
  burnAlertBodyMany?: unknown;
}): WallSettings {
  return {
    googleLogin: row.googleLogin,
    appleLogin: row.appleLogin,
    phoneLogin: row.phoneLogin,
    emailLogin: row.emailLogin,
    guestLogin: row.guestLogin !== false,
    registrationsOpen: row.registrationsOpen,
    postingOpen: row.postingOpen,
    burningOpen: row.burningOpen,
    safetyCheckOpen: Boolean(row.safetyCheckOpen),
    moderationKeywords: parseModerationKeywords(row.moderationKeywords),
    noticeOpen: row.noticeOpen !== false,
    noticeTitle: typeof row.noticeTitle === "string" ? row.noticeTitle : "",
    notice: row.notice,
    noticeLinks: parseNoticeLinks(row.noticeLinks),
    noticeStyle: parseNoticeStyle(row.noticeStyle),
    noticeFont: parseNoticeFont(row.noticeFont),
    noticeSize: parseNoticeSize(row.noticeSize),
    noticeColor: parseNoticeColor(row.noticeColor),
    ...burnAlertFromSettings({
      burnAlertTitle: row.burnAlertTitle as string | undefined,
      burnAlertBodyOne: row.burnAlertBodyOne as string | undefined,
      burnAlertBodyMany: row.burnAlertBodyMany as string | undefined,
    }),
  };
}

export const storage: IStorage = isDemoMode
  ? new DemoStorage()
  : new DatabaseStorage();
