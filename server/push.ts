import { createECDH, createHash } from "node:crypto";
import webpush from "web-push";
import { OPERATOR } from "@shared/site";
import { storage } from "./storage";

function urlSafe(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function keysFromSecret(secret: string) {
  const ecdh = createECDH("prime256v1");
  let seed = createHash("sha256").update(`pidaka-vapid:${secret}`).digest();
  for (let i = 0; i < 8; i++) {
    try {
      ecdh.setPrivateKey(seed);
      return {
        publicKey: urlSafe(ecdh.getPublicKey()),
        privateKey: urlSafe(ecdh.getPrivateKey()),
      };
    } catch {
      seed = createHash("sha256").update(seed).digest();
    }
  }
  return null;
}

function loadKeys() {
  const fromEnvPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const fromEnvPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  if (fromEnvPublic && fromEnvPrivate) {
    return { publicKey: fromEnvPublic, privateKey: fromEnvPrivate };
  }
  const secret = process.env.ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret) return null;
  return keysFromSecret(secret);
}

const loaded = loadKeys();
let keys = loaded;
if (keys) {
  try {
    webpush.setVapidDetails(`mailto:${OPERATOR.email}`, keys.publicKey, keys.privateKey);
  } catch (err) {
    console.error("VAPID keys were refused", err);
    keys = null;
  }
}

export function vapidPublicKey(): string | null {
  return keys?.publicKey ?? null;
}

export function burnAlertsReady() {
  return Boolean(keys);
}

export async function notifyBurnArrived(userId: string, unread: number) {
  if (!keys) return;
  const subs = await storage.listPushSubscriptions(userId);
  if (subs.length === 0) return;
  const payload = JSON.stringify({ kind: "burn", n: Math.max(1, unread) });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 12 * 60 * 60, urgency: "high" },
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await storage.deletePushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    }),
  );
}
