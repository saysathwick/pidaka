import { eq, like, sql } from "drizzle-orm";
import { db, isDemoMode } from "./db";
import { users, pidakas, burns } from "@shared/schema";
import { blind, isBlind, isSealed, open, seal } from "./crypto";

export function revealUser<T extends { email: string; emailEnc?: string | null; phone: string | null; phoneEnc?: string | null }>(user: T): T {
  return {
    ...user,
    email: user.emailEnc ? open(user.emailEnc) : (user.email.includes("@") ? user.email : user.email),
    phone: user.phoneEnc ? open(user.phoneEnc) : user.phone,
  };
}

export function revealPidaka<T extends { content: string }>(row: T): T {
  return { ...row, content: open(row.content) };
}

export function revealBurn<T extends { message: string; pidakaExcerpt: string }>(row: T): T {
  return { ...row, message: open(row.message), pidakaExcerpt: open(row.pidakaExcerpt) };
}

export function vaultUserInsert(input: { email: string; phone?: string | null }) {
  const email = input.email.toLowerCase();
  const phone = input.phone ?? null;
  return {
    email: isBlind(email) ? email : blind(email),
    emailEnc: email.includes("@") ? seal(email) : null,
    phone: phone ? (isBlind(phone) ? phone : blind(phone)) : null,
    phoneEnc: phone && !isBlind(phone) ? seal(phone) : null,
  };
}

export async function migrateVault() {
  if (isDemoMode || !db) return;
  const byEmail = await db.select().from(users).where(like(users.email, "%@%"));
  const byPhone = await db.select().from(users).where(like(users.phone, "+%"));
  const seen = new Set<string>();
  let names = 0;
  for (const user of [...byEmail, ...byPhone]) {
    if (seen.has(user.id)) continue;
    seen.add(user.id);
    const patch: { email?: string; emailEnc?: string; phone?: string | null; phoneEnc?: string | null } = {};
    if (user.email.includes("@")) {
      patch.emailEnc = user.emailEnc || seal(user.email.toLowerCase());
      patch.email = blind(user.email.toLowerCase());
    }
    if (user.phone && !isBlind(user.phone)) {
      patch.phoneEnc = user.phoneEnc || seal(user.phone);
      patch.phone = blind(user.phone);
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, user.id));
      names += 1;
    }
  }

  const wall = await db
    .select({ id: pidakas.id, content: pidakas.content })
    .from(pidakas)
    .where(sql`${pidakas.content} not like 'pdk1.%'`);
  for (const row of wall) {
    await db.update(pidakas).set({ content: seal(row.content) }).where(eq(pidakas.id, row.id));
  }

  const notes = await db.select({
    id: burns.id,
    message: burns.message,
    pidakaExcerpt: burns.pidakaExcerpt,
  }).from(burns).where(sql`${burns.message} not like 'pdk1.%' or ${burns.pidakaExcerpt} not like 'pdk1.%'`);
  for (const row of notes) {
    const patch: { message?: string; pidakaExcerpt?: string } = {};
    if (!isSealed(row.message)) patch.message = seal(row.message);
    if (row.pidakaExcerpt && !isSealed(row.pidakaExcerpt)) patch.pidakaExcerpt = seal(row.pidakaExcerpt);
    if (Object.keys(patch).length > 0) {
      await db.update(burns).set(patch).where(eq(burns.id, row.id));
    }
  }
  if (names || wall.length || notes.length) {
    console.log(`[crypto] vault sealed ${names} names, ${wall.length} pidakas, ${notes.length} burns`);
  }
}
