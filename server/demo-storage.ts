import { randomUUID } from "node:crypto";
import type { Burn, InsertUser, Pidaka, User } from "@shared/schema";
import { excerptPidaka } from "@shared/names";
import type { WallSettings } from "@shared/wall";
import type { IStorage } from "./storage";
import { blind } from "./crypto";
import { revealUser, vaultUserInsert } from "./vault";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600000);
}

const DEMO_PIDAKA_LINES = [
  "I still check the last message I never sent.",
  "Nobody in this house knows I applied to leave.",
  "If tonight is the last time I say this: I meant it.",
  "I rehearsed the goodbye in the bathroom mirror and then asked about dinner.",
  "The photo is still in the drawer. I have not opened it. I know which one it is.",
  "I said I was fine on the call. I hung up and sat on the floor.",
  "There is a ticket in my bag I have not told anyone about.",
  "I keep their mug. I wash it. I put it back.",
  "I almost wrote their name here. I did not.",
  "The last time we spoke I made it sound like weather.",
  "I walk past their building on purpose and call it a shortcut.",
  "I have a draft with no recipient. It has been there for months.",
  "I smiled in the group photo. I was already gone.",
  "They think I forgot. I did not. I chose not to answer.",
  "I told my mother I was busy. I was sitting in the dark.",
  "I still have the key. I do not have a door.",
  "I practised saying it out loud and my voice did not sound like mine.",
  "The apology is written. It is not sent. That is the whole story.",
  "I keep counting the days since I last told the truth at a table.",
  "I said see you soon and I did not mean soon.",
  "I packed a bag once and unpacked it before morning.",
  "Nobody asked. I would have answered if they had.",
  "I wear the ring on a chain now. Under the shirt. Still there.",
  "I laughed at the joke so they would not see the other thing.",
  "I know which song I cannot play in this city.",
  "I left the light on so the house would look awake.",
  "I keep starting letters with I hope you are well and then I stop.",
  "They asked what I wanted. I named a restaurant. I meant a life.",
  "I still have the voicemail. I have not played it this month. I will play it tonight and then I will not sleep and then I will play it again at four when the house is honest. I keep meaning to delete it. My thumb hovers. The screen goes dark. In the morning I tell myself it is only a file. It is not only a file. It is the last time their voice was not careful with me. I walk to work with it in my pocket like a stone. I do not tell anyone I am carrying a stone. If you are still reading, you already know how this goes. I will not press play until I am alone. I am never as alone as I pretend. I have a route now that avoids the street with the bakery. I tell people it is quieter. It is not quieter. It is the street where we stood in the rain and I said nothing useful. I can still smell the yeast. I can still see their hands. I write this in pieces because the whole thing will not fit in a mouth. Page after page I am still in that rain. I am still choosing the long way home.",
  "I packed the bag in the afternoon so I would not have to think in the dark. Socks. The cheap passport. A letter I will not leave on the table because leaving it would make it real. I stood in the doorway and counted the rooms as if they could argue. The kettle clicked in the kitchen. Someone laughed on a show I used to watch with them. I put the bag back under the bed and I made tea and I sat on the floor with the mug between my hands until it went cold. Tomorrow I will pack it again. I will tell myself tomorrow is different. Tomorrow is the same doorway. I am writing this so the wall can hold it, because my mouth will not. There is a ticket in the inner pocket that expires and I keep renewing it like a superstition. I have told no one. If I say it out loud the house will change shape. I am not ready for a different house. I am ready only to admit I packed the bag.",
  "I keep a list I do not call a list. The first time I almost said it. The second time I laughed instead. The third time I sent a photograph of the sky so I would not have to send the sentence. I have become an expert at weather. I can talk about rain until the rain is over. I can talk about work until the room empties. I can walk out of a dinner with my coat on and my truth still folded in the pocket like a napkin I stole. Nobody stops me. That is the part I cannot forgive. I wanted someone to put a hand on the door. I wanted the question. I had the answer ready and then I swallowed it with water. If this takes more than one look, good. It took more than one year. I am still in the coat. I am still at the door. I am still hoping the wall is a kind of hand. I still have the voicemail. I have not played it this month. I will play it tonight and then I will not sleep and then I will play it again at four when the house is honest. I keep meaning to delete it. My thumb hovers. The screen goes dark. In the morning I tell myself it is only a file. It is not only a file. It is the last time their voice was not careful with me. I walk to work with it in my pocket like a stone. I packed the bag in the afternoon so I would not have to think in the dark. Socks. The cheap passport. A letter I will not leave on the table because leaving it would make it real. I stood in the doorway and counted the rooms as if they could argue. Tomorrow I will pack it again. I will tell myself tomorrow is different. Tomorrow is the same doorway.",
];

function seedDemoPidakas(): Pidaka[] {
  return DEMO_PIDAKA_LINES.map((content, index) => {
    const age = index === 2 ? 46.4 : 0.8 + ((index * 1.37) % 45);
    const left = Math.max(1.4, 48 - age);
    const creator = `stranger-${String.fromCharCode(97 + (index % 12))}`;
    return {
      id: `demo-${index + 1}`,
      content,
      creatorUserId: creator,
      createdAt: hoursAgo(age),
      expiresAt: hoursFromNow(left),
    };
  });
}

export class DemoStorage implements IStorage {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, User>();
  private usersByPhone = new Map<string, User>();
  private usersByAuth = new Map<string, User>();
  private pidakas: Pidaka[] = seedDemoPidakas();
  private burns: Burn[] = [];
  private views = new Map<string, Set<string>>();

  async getUser(id: string) {
    const user = this.users.get(id);
    return user ? revealUser(user) : undefined;
  }

  async getUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    const user = this.usersByEmail.get(normalized) || this.usersByEmail.get(blind(normalized));
    return user ? revealUser(user) : undefined;
  }

  async getUserByPhone(phone: string) {
    const user = this.usersByPhone.get(phone) || this.usersByPhone.get(blind(phone));
    return user ? revealUser(user) : undefined;
  }

  async getUserByAuth(provider: string, subject: string) {
    const user = this.usersByAuth.get(`${provider}:${subject}`);
    return user ? revealUser(user) : undefined;
  }

  async getUserByAnonymousName(name: string) {
    const user = Array.from(this.users.values()).find((row) => row.anonymousName === name);
    return user ? revealUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser) {
    const vaulted = vaultUserInsert({ email: insertUser.email, phone: insertUser.phone });
    const user: User = {
      id: randomUUID(),
      email: vaulted.email,
      emailEnc: vaulted.emailEnc,
      password: insertUser.password ?? "",
      phone: vaulted.phone,
      phoneEnc: vaulted.phoneEnc,
      authProvider: insertUser.authProvider ?? "password",
      authSubject: insertUser.authSubject ?? "",
      anonymousName: insertUser.anonymousName,
      burnsSentCount: 0,
      burnsReceivedCount: 0,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(insertUser.email.toLowerCase(), user);
    this.usersByEmail.set(vaulted.email, user);
    if (insertUser.phone) this.usersByPhone.set(insertUser.phone, user);
    if (user.phone) this.usersByPhone.set(user.phone, user);
    if (user.authSubject) this.usersByAuth.set(`${user.authProvider}:${user.authSubject}`, user);

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

    return revealUser(user);
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 150);
  }

  async getPidakasByCreator(userId: string) {
    const now = Date.now();
    return this.pidakas
      .filter((p) => p.creatorUserId === userId && p.expiresAt.getTime() > now)
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
    return this.burns.filter((b) => b.receiverUserId === userId).slice(0, 100);
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

  private wall: WallSettings | null = null;

  async deletePidaka(id: string) {
    const before = this.pidakas.length;
    this.pidakas = this.pidakas.filter((p) => p.id !== id);
    for (const seen of Array.from(this.views.values())) {
      seen.delete(id);
    }
    return this.pidakas.length !== before;
  }

  async getWallSettings(seed: WallSettings) {
    if (!this.wall) this.wall = { ...seed };
    return { ...this.wall };
  }

  async saveWallSettings(next: WallSettings) {
    this.wall = { ...next };
    return { ...this.wall };
  }

  async adminStats() {
    const now = Date.now();
    return {
      users: this.users.size,
      pidakas: this.pidakas.filter((p) => p.expiresAt.getTime() > now).length,
      burns: this.burns.length,
    };
  }

  async listAdminPidakas() {
    const now = Date.now();
    return this.pidakas
      .filter((p) => p.expiresAt.getTime() > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 200)
      .map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
        creatorUserId: p.creatorUserId,
        anonymousName: this.users.get(p.creatorUserId)?.anonymousName || p.creatorUserId,
      }));
  }

  async listAdminUsers() {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 200)
      .map((user) => {
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
