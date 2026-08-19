import { randomUUID } from "node:crypto";
import type { Burn, InsertUser, Pidaka, User } from "@shared/schema";
import { excerptPidaka } from "@shared/names";
import type { IStorage } from "./storage";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600000);
}

export class DemoStorage implements IStorage {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, User>();
  private pidakas: Pidaka[] = [
    {
      id: "demo-1",
      content: "I still check the last message I never sent.",
      creatorUserId: "stranger-a",
      createdAt: hoursAgo(5),
      expiresAt: hoursFromNow(43),
    },
    {
      id: "demo-2",
      content: "Nobody in this house knows I applied to leave.",
      creatorUserId: "stranger-b",
      createdAt: hoursAgo(14),
      expiresAt: hoursFromNow(34),
    },
    {
      id: "demo-3",
      content: "If tonight is the last time I say this: I meant it.",
      creatorUserId: "stranger-c",
      createdAt: hoursAgo(46.4),
      expiresAt: hoursFromNow(1.6),
    },
  ];
  private burns: Burn[] = [];
  private views = new Map<string, Set<string>>();

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByEmail(email: string) {
    return this.usersByEmail.get(email.toLowerCase());
  }

  async getUserByAnonymousName(name: string) {
    return Array.from(this.users.values()).find((user) => user.anonymousName === name);
  }

  async createUser(insertUser: InsertUser) {
    const user: User = {
      id: randomUUID(),
      email: insertUser.email,
      password: insertUser.password,
      anonymousName: insertUser.anonymousName,
      burnsSentCount: 0,
      burnsReceivedCount: 0,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user);

    const welcome: Burn = {
      id: randomUUID(),
      pidakaId: "demo-3",
      senderUserId: "stranger-c",
      receiverUserId: user.id,
      message: "The wall heard you before you spoke. Stay.",
      pidakaExcerpt: "If tonight is the last time I say this: I meant it.",
      readAt: null,
      createdAt: new Date(),
    };
    this.burns.unshift(welcome);
    user.burnsReceivedCount = 1;

    return user;
  }

  async getUserStats(id: string) {
    const user = this.users.get(id);
    return {
      burnsSentCount: user?.burnsSentCount ?? 0,
      burnsReceivedCount: user?.burnsReceivedCount ?? 0,
    };
  }

  async getActivePidakas() {
    const now = Date.now();
    return this.pidakas
      .filter((p) => p.expiresAt.getTime() > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPidaka(content: string, creatorUserId: string) {
    const pidaka: Pidaka = {
      id: randomUUID(),
      content,
      creatorUserId,
      createdAt: new Date(),
      expiresAt: hoursFromNow(48),
    };
    this.pidakas.unshift(pidaka);
    return pidaka;
  }

  async getPidaka(id: string) {
    return this.pidakas.find((p) => p.id === id);
  }

  async deleteExpiredPidakas() {
    const now = Date.now();
    this.pidakas = this.pidakas.filter((p) => p.expiresAt.getTime() > now);
    const live = new Set(this.pidakas.map((p) => p.id));
    for (const seen of Array.from(this.views.values())) {
      for (const pidakaId of Array.from(seen)) {
        if (!live.has(pidakaId)) seen.delete(pidakaId);
      }
    }
  }

  async createBurn(
    pidakaId: string,
    senderUserId: string,
    receiverUserId: string,
    message: string,
  ) {
    const pidaka = this.pidakas.find((p) => p.id === pidakaId);
    const burn: Burn = {
      id: randomUUID(),
      pidakaId,
      senderUserId,
      receiverUserId,
      message,
      pidakaExcerpt: excerptPidaka(pidaka?.content ?? ""),
      readAt: null,
      createdAt: new Date(),
    };
    this.burns.unshift(burn);

    const sender = this.users.get(senderUserId);
    if (sender) sender.burnsSentCount += 1;
    const receiver = this.users.get(receiverUserId);
    if (receiver) receiver.burnsReceivedCount += 1;

    return burn;
  }

  async getUserBurnsInbox(userId: string) {
    return this.burns.filter((b) => b.receiverUserId === userId);
  }

  async countUnreadBurns(userId: string) {
    return this.burns.filter((b) => b.receiverUserId === userId && !b.readAt).length;
  }

  async markBurnsRead(userId: string) {
    const now = new Date();
    for (const burn of this.burns) {
      if (burn.receiverUserId === userId && !burn.readAt) {
        burn.readAt = now;
      }
    }
  }

  async getSeenIds(viewerId: string) {
    return Array.from(this.views.get(viewerId) ?? []);
  }

  async markSeen(pidakaId: string, viewerId: string) {
    const set = this.views.get(viewerId) ?? new Set<string>();
    set.add(pidakaId);
    this.views.set(viewerId, set);
  }

  async getWitnessCounts() {
    const counts: Record<string, number> = {};
    for (const seen of Array.from(this.views.values())) {
      for (const pidakaId of Array.from(seen)) {
        counts[pidakaId] = (counts[pidakaId] ?? 0) + 1;
      }
    }
    return counts;
  }
}
