import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "pdk1.";

function masterKey() {
  const secret = process.env.ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY or SESSION_SECRET must be set");
  }
  return createHash("sha256").update(secret).digest();
}

function encKey() {
  return createHmac("sha256", masterKey()).update("pidaka-seal").digest();
}

function idxKey() {
  return createHmac("sha256", masterKey()).update("pidaka-index").digest();
}

export function isSealed(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}

export function isBlind(value: string | null | undefined): boolean {
  return Boolean(value && /^[a-f0-9]{64}$/.test(value));
}

export function seal(plain: string): string {
  if (!plain || isSealed(plain)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function open(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!isSealed(stored)) return stored;
  const parts = stored.slice(PREFIX.length).split(".");
  if (parts.length !== 3) return stored;
  const [ivb, tagb, encb] = parts;
  const decipher = createDecipheriv("aes-256-gcm", encKey(), Buffer.from(ivb, "base64url"));
  decipher.setAuthTag(Buffer.from(tagb, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encb, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function blind(value: string): string {
  if (!value || isBlind(value)) return value;
  return createHmac("sha256", idxKey()).update(value).digest("hex");
}

export function digestsEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
