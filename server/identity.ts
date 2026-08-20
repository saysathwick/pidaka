import { createHash, randomBytes, randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { isDemoMode } from "./db";
import { generateAnonymousName } from "@shared/names";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET!;

type AuthProvider = "google" | "apple" | "phone";

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function publicOrigin(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const env = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5000";
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

export function signAppToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function signOAuthState(provider: AuthProvider) {
  return jwt.sign({ provider, n: randomBytes(8).toString("hex") }, JWT_SECRET, { expiresIn: "10m" });
}

export function readOAuthState(state: string): AuthProvider | null {
  try {
    const decoded = jwt.verify(state, JWT_SECRET) as { provider?: string };
    if (decoded.provider === "google" || decoded.provider === "apple") return decoded.provider;
    return null;
  } catch {
    return null;
  }
}

async function uniqueAnonymousName(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const name = generateAnonymousName();
    const taken = await storage.getUserByAnonymousName(name);
    if (!taken) return name;
  }
  return `${generateAnonymousName()} ${Date.now().toString(36).slice(-3)}`;
}

function syntheticEmail(provider: string, subject: string) {
  const stamp = createHash("sha256").update(`${provider}:${subject}`).digest("hex").slice(0, 20);
  return `${provider}.${stamp}@users.pidaka`;
}

export async function findOrCreateAuthUser(input: {
  provider: AuthProvider;
  subject: string;
  email?: string | null;
  phone?: string | null;
  allowCreate?: boolean;
}): Promise<{ user: User; created: boolean }> {
  const existingAuth = await storage.getUserByAuth(input.provider, input.subject);
  if (existingAuth) return { user: existingAuth, created: false };

  if (input.phone) {
    const byPhone = await storage.getUserByPhone(input.phone);
    if (byPhone) return { user: byPhone, created: false };
  }

  if (input.email) {
    const byEmail = await storage.getUserByEmail(input.email.toLowerCase());
    if (byEmail) return { user: byEmail, created: false };
  }

  if (input.allowCreate === false) {
    throw new Error("The wall is not taking names tonight");
  }

  const user = await storage.createUser({
    email: (input.email || syntheticEmail(input.provider, input.subject)).toLowerCase(),
    password: "",
    phone: input.phone ?? null,
    authProvider: input.provider,
    authSubject: input.subject,
    anonymousName: await uniqueAnonymousName(),
  });
  return { user, created: true };
}

export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : `+${digits}`;
}

export function issuePhoneCode(phone: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

export function consumePhoneCode(phone: string, code: string) {
  const row = otpStore.get(phone);
  if (!row) return false;
  if (row.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return false;
  }
  if (row.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

export async function sendPhoneCode(phone: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    console.log(`[auth] Phone code for ${phone}: ${code}`);
    return { delivered: false as const };
  }
  const body = new URLSearchParams({
    To: phone,
    From: from,
    Body: `Pidaka code: ${code}`,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Could not send the code");
  }
  return { delivered: true as const };
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appleConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
  );
}

export function googleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function appleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/apple/callback`,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params}`;
}

export async function googleProfile(origin: string, code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error("Google did not accept the sign-in");
  const tokens = await tokenRes.json() as { access_token?: string };
  if (!tokens.access_token) throw new Error("Google did not accept the sign-in");
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Google profile failed");
  const profile = await profileRes.json() as { sub?: string; email?: string };
  if (!profile.sub) throw new Error("Google profile failed");
  return { subject: profile.sub, email: profile.email ?? null };
}

function appleClientSecret() {
  const key = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return jwt.sign({}, key, {
    algorithm: "ES256",
    issuer: process.env.APPLE_TEAM_ID,
    subject: process.env.APPLE_CLIENT_ID,
    audience: "https://appleid.apple.com",
    expiresIn: "1h",
    keyid: process.env.APPLE_KEY_ID,
  });
}

export async function appleProfile(origin: string, code: string) {
  const body = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    client_secret: appleClientSecret(),
    code,
    grant_type: "authorization_code",
    redirect_uri: `${origin}/api/auth/apple/callback`,
  });
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error("Apple did not accept the sign-in");
  const tokens = await tokenRes.json() as { id_token?: string };
  if (!tokens.id_token) throw new Error("Apple did not accept the sign-in");
  const payload = jwt.decode(tokens.id_token) as { sub?: string; email?: string } | null;
  if (!payload?.sub) throw new Error("Apple profile failed");
  return { subject: payload.sub, email: payload.email ?? null };
}

export function demoOAuthEnabled() {
  return isDemoMode || process.env.NODE_ENV !== "production";
}
